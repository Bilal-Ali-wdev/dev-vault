import QRCode from "qrcode";
import { generateSecret, generateURI } from "otplib";
import { apiSignedIn, handler, HttpError, ok } from "@/lib/api";
import { decrypt, encrypt } from "@/lib/crypto";
import { User } from "@/lib/models";

/** Creates (or re-shows) a pending TOTP secret for enrolment. */
export const GET = handler(async () => {
  const a = await apiSignedIn();
  if (!a.user.emailVerified) throw new HttpError(403, "Verify your email first.");
  if (a.user.mfa.enabled) throw new HttpError(400, "MFA is already on.");
  let secret: string;
  if (a.user.mfa.pendingSecretEnc) secret = decrypt(a.user.mfa.pendingSecretEnc);
  else {
    secret = generateSecret();
    await User.updateOne({ _id: a.user._id }, { $set: { "mfa.pendingSecretEnc": encrypt(secret) } });
  }
  const uri = generateURI({ issuer: "DevVault", label: a.user.email, secret });
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 196, color: { dark: "#1E293B", light: "#FFFFFF" } });
  return ok({ qr, key: secret.match(/.{1,4}/g)!.join(" ") });
});
