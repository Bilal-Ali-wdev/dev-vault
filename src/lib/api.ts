import "server-only";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z, ZodError } from "zod";
import { connectDB } from "./db";
import { getAuth, nextStep, REAUTH_WINDOW_MS, type AuthState } from "./auth";
import { Project, type IProject } from "./models";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

/** Wrap a route handler: consistent JSON errors, DB connected. */
export function handler<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      await connectDB();
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      if (e instanceof ZodError) {
        const first = e.issues[0];
        return NextResponse.json({ error: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input" }, { status: 400 });
      }
      console.error("[api]", e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Expected a JSON body");
  }
  return schema.parse(json);
}

/** Signed in (any onboarding state). */
export async function apiSignedIn(): Promise<AuthState> {
  const a = await getAuth();
  if (!a) throw new HttpError(401, "Not signed in");
  return a;
}

/** Fully onboarded and MFA passed. */
export async function apiUser(): Promise<AuthState> {
  const a = await apiSignedIn();
  if (nextStep(a)) throw new HttpError(403, "Finish account setup first", "onboarding");
  return a;
}

export function requireRecentMfa(a: AuthState) {
  if (!a.session.mfaAt || Date.now() - a.session.mfaAt > REAUTH_WINDOW_MS) {
    throw new HttpError(403, "Confirm with your authenticator to continue", "mfa_required");
  }
}

export function oid(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, "Not found");
  return new Types.ObjectId(id);
}

/** Load a project and enforce ownership (tenant isolation). */
export async function ownedProject(a: AuthState, id: string): Promise<IProject> {
  const p = await Project.findOne({ _id: oid(id), userId: a.user._id }).lean<IProject>();
  if (!p) throw new HttpError(404, "Project not found");
  return p;
}

export function clientInfo(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}
