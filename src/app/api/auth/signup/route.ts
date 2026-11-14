import bcrypt from "bcryptjs";
import { z } from "zod";
import { body, handler, HttpError, ok } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { User, type IUser } from "@/lib/models";
import { issueEmailOtp } from "@/lib/otp";

const Schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.email("Enter a valid email").transform((s) => s.toLowerCase().trim()),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(200)
    .refine((p) => /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p), "Include an uppercase letter, a number and a symbol"),
  acceptTerms: z.literal(true, { error: "Accept the terms to continue" }),
});

export const POST = handler(async (req) => {
  const input = await body(req, Schema);
  if (await User.exists({ email: input.email })) throw new HttpError(409, "An account with this email already exists. Log in instead.");
  const user = await User.create({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12) });
  const sent = await issueEmailOtp(user.toObject() as IUser);
  await setSession({ uid: String(user._id), mfaPassed: false });
  return ok({ ok: true, next: "/verify-email", emailDelivered: sent.delivered });
});
