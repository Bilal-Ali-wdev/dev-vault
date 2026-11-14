import bcrypt from "bcryptjs";
import { z } from "zod";
import { body, handler, HttpError, ok } from "@/lib/api";
import { nextStep, setSession } from "@/lib/auth";
import { User, type IUser } from "@/lib/models";

const Schema = z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1) });

// Equalises timing when the email doesn't exist.
const DUMMY_HASH = bcrypt.hashSync("devvault-timing-equaliser", 12);

export const POST = handler(async (req) => {
  const { email, password } = await body(req, Schema);
  const user = await User.findOne({ email }).lean<IUser>();
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, "Incorrect email or password.");
  await setSession({ uid: String(user._id), mfaPassed: false });
  const next = nextStep({ user, session: { uid: String(user._id), mfaPassed: false } }) ?? "/dashboard";
  return ok({ ok: true, next });
});
