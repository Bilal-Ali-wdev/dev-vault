import { z } from "zod";
import { apiUser, body, handler, ok, ownedProject } from "@/lib/api";
import { Doc, type IDoc } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

const Input = z.object({
  title: z.string().trim().min(1, "Give the doc a title").max(200),
  kind: z.enum(["doc", "architecture"]).default("doc"),
  content: z.string().max(100_000).default(""),
});

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const docs = await Doc.find({ projectId: p._id }).sort({ updatedAt: -1 }).lean<IDoc[]>();
  return ok({ docs });
});

export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const input = await body(req, Input);
  const d = await Doc.create({ ...input, userId: a.user._id, projectId: p._id });
  return ok({ doc: d.toObject() }, { status: 201 });
});
