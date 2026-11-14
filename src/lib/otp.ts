import "server-only";
import { User, type IUser } from "./models";
import { sha256, sixDigitCode } from "./crypto";
import { sendOtpEmail } from "./mail";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 45 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const otpHash = (uid: string, code: string) => sha256(`${uid}:${code}`);

export async function issueEmailOtp(user: IUser) {
  const code = sixDigitCode();
  await User.updateOne(
    { _id: user._id },
    { $set: { emailOtp: { hash: otpHash(String(user._id), code), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, sentAt: new Date() } } }
  );
  return sendOtpEmail(user.email, user.name, code);
}
