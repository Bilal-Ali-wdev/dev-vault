import { z } from "zod";
import { apiUser, body, handler, oid, ok, ownedProject } from "@/lib/api";
import { ENVIRONMENTS, Service } from "@/lib/models";

type Ctx = { params: Promise<{ id: string; serviceId: string }> };

const Patch = z.object({
  usedFor: z.string().max(300).optional(),
  accountEmail: z.string().trim().max(200).optional(),
  signInWith: z.string().max(40).optional(),
  plan: z.string().max(80).optional(),
  region: z.string().max(200).optional(),
  dashboardUrl: z.string().max(500).optional(),
  environments: z.array(z.enum(ENVIRONMENTS)).optional(),
  notes: z.string().max(2000).optional(),
});

export const PATCH = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const { id, serviceId } = await ctx.params;
  const p = await ownedProject(a, id);
  const input = await body(req, Patch);
  await Service.updateOne({ _id: oid(serviceId), projectId: p._id }, { $set: input });
  return ok({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { id, serviceId } = await ctx.params;
  const p = await ownedProject(a, id);
  await Service.deleteOne({ _id: oid(serviceId), projectId: p._id });
  return ok({ ok: true });
});
