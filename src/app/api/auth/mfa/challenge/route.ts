import { z } from "zod";
import { apiSignedIn, body, handler, HttpError, ok } from "@/lib/api";
import { nextStep, setSession, verifyMfaCode } from "@/lib/auth";

// Simple in-memory brute-force limiter per user (5 tries / 5 min).
const tries = new Map<string, { n: number; at: number }>();

/** Login-time MFA (also used for re-authentication before sensitive vault actions). */
export const POST = handler(async (req) => {
  const a = await apiSignedIn();
  const { code } = await body(req, z.object({ code: z.string().min(6).max(20) }));
  if (!a.user.mfa.enabled) throw new HttpError(400, "MFA isn't set up.");
  const k = String(a.user._id);
  const t = tries.get(k);
  if (t && Date.now() - t.at < 5 * 60_000 && t.n >= 5) throw new HttpError(429, "Too many attempts. Wait a few minutes and try again.");
  if (!(await verifyMfaCode(a.user, code))) {
    tries.set(k, { n: (t && Date.now() - t.at < 5 * 60_000 ? t.n : 0) + 1, at: t && Date.now() - t.at < 5 * 60_000 ? t.at : Date.now() });
    throw new HttpError(400, "That code isn't valid.");
  }
  tries.delete(k);
  const session = { uid: k, mfaPassed: true, mfaAt: Date.now() };
  await setSession(session);
  return ok({ ok: true, next: nextStep({ user: a.user, session }) ?? "/dashboard" });
});
