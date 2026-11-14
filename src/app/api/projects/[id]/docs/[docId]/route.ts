import { z } from "zod";
import { apiUser, body, handler, oid, ok, ownedProject } from "@/lib/api";
import { Doc } from "@/lib/models";

type Ctx = { params: Promise<{ id: string; docId: string }> };

const Patch = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  kind: z.enum(["doc", "architecture"]).optional(),
  content: z.string().max(100_000).optional(),
});

export const PATCH = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const { id, docId } = await ctx.params;
  const p = await ownedProject(a, id);
  await Doc.updateOne({ _id: oid(docId), projectId: p._id }, { $set: await body(req, Patch) });
  return ok({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { id, docId } = await ctx.params;
  const p = await ownedProject(a, id);
  await Doc.deleteOne({ _id: oid(docId), projectId: p._id });
  return ok({ ok: true });
});
