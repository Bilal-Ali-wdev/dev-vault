import { z } from "zod";
import { apiSignedIn, apiUser, body, handler, ok } from "@/lib/api";
import { nextStep } from "@/lib/auth";
import { User } from "@/lib/models";

export const GET = handler(async () => {
  const a = await apiSignedIn();
  return ok({
    id: String(a.user._id),
    name: a.user.name,
    email: a.user.email,
    emailVerified: a.user.emailVerified,
    mfaEnabled: a.user.mfa.enabled,
    recoveryCodesLeft: a.user.mfa.recoveryHashes.length,
    next: nextStep(a),
  });
});

export const PATCH = handler(async (req) => {
  const a = await apiUser();
  const { name } = await body(req, z.object({ name: z.string().trim().min(1).max(120) }));
  await User.updateOne({ _id: a.user._id }, { $set: { name } });
  return ok({ ok: true });
});
