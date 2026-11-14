import { z } from "zod";
import { apiSignedIn, body, handler, HttpError, ok } from "@/lib/api";
import { setSession, verifyTotp } from "@/lib/auth";
import { normalizeRecovery, recoveryCode, sha256 } from "@/lib/crypto";
import { User } from "@/lib/models";

export const POST = handler(async (req) => {
  const a = await apiSignedIn();
  const { code } = await body(req, z.object({ code: z.string() }));
  if (!a.user.emailVerified) throw new HttpError(403, "Verify your email first.");
  if (a.user.mfa.enabled) throw new HttpError(400, "MFA is already on.");
  const pending = a.user.mfa.pendingSecretEnc;
  if (!pending) throw new HttpError(400, "Start setup again.");
  const v = verifyTotp(a.user, code, pending);
  if (!v.ok) throw new HttpError(400, "That code didn't match. Check your app's clock and try the newest code.");

  const codes = Array.from({ length: 10 }, recoveryCode);
  await User.updateOne(
    { _id: a.user._id },
    {
      $set: {
        "mfa.enabled": true,
        "mfa.secretEnc": pending,
        "mfa.pendingSecretEnc": null,
        "mfa.enabledAt": new Date(),
        "mfa.lastStep": v.step,
        "mfa.recoveryHashes": codes.map((c) => sha256(normalizeRecovery(c))),
      },
    }
  );
  await setSession({ uid: String(a.user._id), mfaPassed: true, mfaAt: Date.now() });
  return ok({ ok: true, recoveryCodes: codes });
});
