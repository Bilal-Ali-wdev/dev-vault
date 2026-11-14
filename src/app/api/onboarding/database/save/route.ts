import { z } from "zod";
import { apiSignedIn, body, handler, HttpError, ok } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { testDatabase, urlHint } from "@/lib/dbtest";
import { DatabaseConnection, User } from "@/lib/models";

const Schema = z.object({
  skip: z.boolean().optional(),
  provider: z.enum(["supabase", "mongodb", "postgres"]).optional(),
  url: z.string().trim().max(2000).optional(),
});

export const POST = handler(async (req) => {
  const a = await apiSignedIn();
  if (!a.user.emailVerified) throw new HttpError(403, "Verify your email first.");
  const input = await body(req, Schema);
  if (!input.skip) {
    if (!input.provider || !input.url) throw new HttpError(400, "Choose a provider and paste a connection URL, or skip for now.");
    const test = await testDatabase(input.provider, input.url);
    await DatabaseConnection.updateMany({ userId: a.user._id }, { $set: { isDefault: false } });
    await DatabaseConnection.create({
      userId: a.user._id,
      provider: input.provider,
      label: "Default connection",
      urlEnc: encrypt(input.url),
      urlHint: urlHint(input.url),
      isDefault: true,
      lastTest: test.ok ? { ok: true, ms: test.ms, meta: test.meta, at: new Date() } : { ok: false, ms: 0, meta: test.error, at: new Date() },
    });
  }
  await User.updateOne({ _id: a.user._id }, { $set: { "onboarding.databaseDone": true } });
  return ok({ ok: true, next: a.user.mfa.enabled ? "/dashboard" : "/onboarding/mfa" });
});
