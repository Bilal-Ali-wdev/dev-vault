import { apiSignedIn, handler, HttpError, ok } from "@/lib/api";
import { issueEmailOtp, OTP_RESEND_MS } from "@/lib/otp";

export const POST = handler(async () => {
  const a = await apiSignedIn();
  if (a.user.emailVerified) throw new HttpError(400, "Email already verified.");
  const sentAt = a.user.emailOtp?.sentAt ? new Date(a.user.emailOtp.sentAt).getTime() : 0;
  const wait = sentAt + OTP_RESEND_MS - Date.now();
  if (wait > 0) throw new HttpError(429, `Wait ${Math.ceil(wait / 1000)}s before requesting another code.`);
  const r = await issueEmailOtp(a.user);
  return ok({ ok: true, emailDelivered: r.delivered, resendInMs: OTP_RESEND_MS });
});
