import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { verifySync } from "otplib";
import { connectDB } from "./db";
import { User, type IUser } from "./models";
import { decrypt, normalizeRecovery, sha256 } from "./crypto";

export const SESSION_COOKIE = "dv_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
/** How long a fresh MFA check unlocks sensitive vault actions. */
export const REAUTH_WINDOW_MS = 15 * 60 * 1000;

export type SessionPayload = { uid: string; mfaPassed: boolean; mfaAt?: number };

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function setSession(p: SessionPayload) {
  const token = await new SignJWT({ ...p })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "string") return null;
    return { uid: payload.uid, mfaPassed: !!payload.mfaPassed, mfaAt: typeof payload.mfaAt === "number" ? payload.mfaAt : undefined };
  } catch {
    return null;
  }
}

export type AuthState = { session: SessionPayload; user: IUser };

export async function getAuth(): Promise<AuthState | null> {
  const session = await readSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.uid).lean<IUser>();
  if (!user) return null;
  return { session, user };
}

/** Where a signed-in user must go next, or null when they have full access. */
export function nextStep(a: AuthState): string | null {
  if (a.user.mfa.enabled && !a.session.mfaPassed) return "/login/mfa";
  if (!a.user.emailVerified) return "/verify-email";
  if (!a.user.mfa.enabled) return a.user.onboarding.databaseDone ? "/onboarding/mfa" : "/onboarding/database";
  return null;
}

/** Page guard for the app: fully onboarded, MFA passed. */
export async function requireUser(): Promise<AuthState> {
  const a = await getAuth();
  if (!a) redirect("/login");
  const step = nextStep(a);
  if (step) redirect(step);
  return a;
}

/** Minutes since the last MFA check, or null if outside the re-auth window. */
export function mfaMinutesAgo(session: SessionPayload): number | null {
  if (!session.mfaAt) return null;
  const ms = Date.now() - session.mfaAt;
  return ms < REAUTH_WINDOW_MS ? Math.floor(ms / 60000) : null;
}

export function verifyTotp(user: IUser, code: string, useSecret?: string | null): { ok: boolean; step?: number } {
  const enc = useSecret ?? user.mfa.secretEnc;
  if (!enc) return { ok: false };
  const token = code.replace(/\D/g, "");
  if (token.length !== 6) return { ok: false };
  const res = verifySync({ secret: decrypt(enc), token, epochTolerance: 30 });
  if (!res.valid) return { ok: false };
  const step = Math.floor(Date.now() / 30000) + (res.delta ?? 0);
  // Replay protection: never accept the same or an older time step twice.
  if (!useSecret && user.mfa.lastStep && step <= user.mfa.lastStep) return { ok: false };
  return { ok: true, step };
}

/** Accepts either a 6-digit TOTP code or a single-use recovery code. */
export async function verifyMfaCode(user: IUser, code: string): Promise<boolean> {
  const totp = verifyTotp(user, code);
  if (totp.ok) {
    await User.updateOne({ _id: user._id }, { $set: { "mfa.lastStep": totp.step } });
    return true;
  }
  const norm = normalizeRecovery(code);
  if (norm.length === 8) {
    const h = sha256(norm);
    const res = await User.updateOne({ _id: user._id, "mfa.recoveryHashes": h }, { $pull: { "mfa.recoveryHashes": h } });
    return res.modifiedCount === 1;
  }
  return false;
}
