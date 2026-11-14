import { z } from "zod";
import { apiSignedIn, body, handler, HttpError, ok } from "@/lib/api";
import { testDatabase } from "@/lib/dbtest";

const DbInput = z.object({
  provider: z.enum(["supabase", "mongodb", "postgres"]),
  url: z.string().trim().min(10, "Paste a connection URL").max(2000),
});

const tries = new Map<string, number[]>();

export const POST = handler(async (req) => {
  const a = await apiSignedIn();
  if (!a.user.emailVerified) throw new HttpError(403, "Verify your email first.");
  const k = String(a.user._id);
  const recent = (tries.get(k) || []).filter((t) => Date.now() - t < 60_000);
  if (recent.length >= 10) throw new HttpError(429, "Too many tests. Try again in a minute.");
  tries.set(k, [...recent, Date.now()]);
  const { provider, url } = await body(req, DbInput);
  const r = await testDatabase(provider, url);
  return ok(r);
});
