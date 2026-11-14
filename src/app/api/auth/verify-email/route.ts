import { z } from "zod";
import { apiSignedIn, body, handler, HttpError, ok } from "@/lib/api";
import { safeEqual } from "@/lib/crypto";
import { User } from "@/lib/models";
import { OTP_MAX_ATTEMPTS, otpHash } from "@/lib/otp";

const Schema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

export const POST = handler(async (req) => {
  const a = await apiSignedIn();
  const { code } = await body(req, Schema);
  if (a.user.emailVerified) return ok({ ok: true, next: "/onboarding/database" });
  const otp = a.user.emailOtp;
  if (!otp) throw new HttpError(400, "Request a new code.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, "Too many wrong attempts. Request a new code.", "otp_locked");
  if (new Date(otp.expiresAt).getTime() < Date.now()) throw new HttpError(400, "This code has expired. Request a new one.", "otp_expired");
  if (!safeEqual(otp.hash, otpHash(String(a.user._id), code))) {
    await User.updateOne({ _id: a.user._id }, { $inc: { "emailOtp.attempts": 1 } });
    const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
    throw new HttpError(400, left > 0 ? `That code isn't right. ${left} ${left === 1 ? "attempt" : "attempts"} left.` : "Too many wrong attempts. Request a new code.");
  }
  await User.updateOne({ _id: a.user._id }, { $set: { emailVerified: true, emailOtp: null } });
  return ok({ ok: true, next: "/onboarding/database" });
});
