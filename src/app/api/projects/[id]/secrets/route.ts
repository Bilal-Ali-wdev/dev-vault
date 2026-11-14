import { z } from "zod";
import { apiUser, body, handler, HttpError, ok, ownedProject } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { ENVIRONMENTS, Secret, type ISecret } from "@/lib/models";
import { audit, toRow } from "@/lib/vault";

type Ctx = { params: Promise<{ id: string }> };

const Input = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Use letters, numbers and underscores, e.g. DATABASE_URL"),
  value: z.string().max(20000).default(""),
  description: z.string().max(300).default(""),
  service: z.string().max(60).default(""),
  environment: z.enum(ENVIRONMENTS),
  rotationDays: z.number().int().min(1).max(3650).nullable().default(null),
});

/** Lists secrets WITHOUT values. Values are only returned by the reveal endpoint after MFA. */
export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const secrets = await Secret.find({ projectId: p._id }).sort({ key: 1 }).lean<ISecret[]>();
  return ok({ secrets: secrets.map(toRow) });
});

export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const input = await body(req, Input);
  const key = input.key.toUpperCase();
  if (await Secret.exists({ projectId: p._id, environment: input.environment, key })) {
    throw new HttpError(409, `${key} already exists in ${input.environment}. Edit it to add a new version.`);
  }
  const s = await Secret.create({
    userId: a.user._id,
    projectId: p._id,
    environment: input.environment,
    key,
    description: input.description,
    service: input.service,
    valueEnc: input.value ? encrypt(input.value) : null,
    version: input.value ? 1 : 0,
    rotationDays: input.rotationDays,
    rotatedAt: input.value ? new Date() : null,
  });
  await audit(a.user._id, p._id, "Created", key, input.environment);
  return ok({ secret: toRow(s.toObject() as ISecret) }, { status: 201 });
});
