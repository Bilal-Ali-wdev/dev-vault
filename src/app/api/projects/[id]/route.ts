import { z } from "zod";
import { apiUser, body, handler, ok, ownedProject } from "@/lib/api";
import { AuditLog, Conversation, Doc, Project, PROJECT_STATUSES, Secret, Service, Task, WorkSession } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

const Patch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  type: z.string().max(60).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  repoUrl: z.union([z.literal(""), z.url()]).optional(),
  liveUrl: z.union([z.literal(""), z.url()]).optional(),
  stack: z.array(z.string().max(40)).max(40).optional(),
  milestone: z.object({ name: z.string().trim().max(120), dueDate: z.string().nullable().optional() }).nullable().optional(),
});

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  return ok({ project: { ...p, _id: String(p._id), userId: undefined, resume: undefined } });
});

export const PATCH = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const input = await body(req, Patch);
  const { milestone, ...rest } = input;
  const set: Record<string, unknown> = { ...rest };
  if (milestone !== undefined) set.milestone = milestone && milestone.name ? { name: milestone.name, dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null } : null;
  await Project.updateOne({ _id: p._id }, { $set: set });
  return ok({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const q = { projectId: p._id, userId: a.user._id };
  await Promise.all([Task.deleteMany(q), WorkSession.deleteMany(q), Secret.deleteMany(q), Service.deleteMany(q), Doc.deleteMany(q), Conversation.deleteMany(q), AuditLog.deleteMany(q)]);
  await Project.deleteOne({ _id: p._id });
  return ok({ ok: true });
});
