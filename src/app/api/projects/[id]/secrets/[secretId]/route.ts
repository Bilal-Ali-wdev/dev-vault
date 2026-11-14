import { z } from "zod";
import { apiUser, body, handler, HttpError, oid, ok, ownedProject } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { Secret, type ISecret } from "@/lib/models";
import { audit } from "@/lib/vault";

type Ctx = { params: Promise<{ id: string; secretId: string }> };

const Patch = z.object({
  value: z.string().max(20000).optional(),
  description: z.string().max(300).optional(),
  service: z.string().max(60).optional(),
  rotationDays: z.number().int().min(1).max(3650).nullable().optional(),
});

export const PATCH = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const { id, secretId } = await ctx.params;
  const p = await ownedProject(a, id);
  const s = await Secret.findOne({ _id: oid(secretId), projectId: p._id }).lean<ISecret>();
  if (!s) throw new HttpError(404, "Secret not found");
  const input = await body(req, Patch);
  const update: Record<string, unknown> = {};
  const set: Record<string, unknown> = {};
  if (input.description !== undefined) set.description = input.description;
  if (input.service !== undefined) set.service = input.service;
  if (input.rotationDays !== undefined) set.rotationDays = input.rotationDays;
  if (input.value !== undefined && input.value !== "") {
    set.valueEnc = encrypt(input.value);
    set.version = s.version + 1;
    set.rotatedAt = new Date();
    // Keep the encrypted previous value for history (never returned by any list endpoint).
    if (s.valueEnc) update.$push = { history: { $each: [{ version: s.version, valueEnc: s.valueEnc, at: s.rotatedAt || s.updatedAt }], $slice: -20 } };
  }
  update.$set = set;
  await Secret.updateOne({ _id: s._id }, update);
  if (set.valueEnc) await audit(a.user._id, p._id, "Updated", s.key, `v${s.version} → v${s.version + 1}`);
  return ok({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { id, secretId } = await ctx.params;
  const p = await ownedProject(a, id);
  const s = await Secret.findOneAndDelete({ _id: oid(secretId), projectId: p._id }).lean<ISecret>();
  if (s) await audit(a.user._id, p._id, "Deleted", s.key, s.environment);
  return ok({ ok: true });
});
