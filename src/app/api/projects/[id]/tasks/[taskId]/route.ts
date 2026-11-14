import { z } from "zod";
import { apiUser, body, handler, HttpError, oid, ok, ownedProject } from "@/lib/api";
import { Project, Task, TASK_PRIORITIES, TASK_STATUSES, type ITask } from "@/lib/models";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

const Patch = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  tag: z.string().trim().max(40).optional(),
  dueDate: z.string().nullable().optional(),
  aiSuggested: z.boolean().optional(),
  hasDoc: z.boolean().optional(),
  order: z.number().optional(),
});

export const PATCH = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const { id, taskId } = await ctx.params;
  const p = await ownedProject(a, id);
  const input = await body(req, Patch);
  const existing = await Task.findOne({ _id: oid(taskId), projectId: p._id }).lean<ITask>();
  if (!existing) throw new HttpError(404, "Task not found");
  const set: Record<string, unknown> = { ...input };
  if (input.dueDate !== undefined) set.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.status && input.status !== existing.status) {
    set.completedAt = input.status === "completed" ? new Date() : null;
    // Moving a card means the user reviewed it.
    set.aiSuggested = false;
  }
  await Task.updateOne({ _id: existing._id }, { $set: set });
  await Project.updateOne({ _id: p._id }, { $set: { lastWorkedAt: new Date() } });
  return ok({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { id, taskId } = await ctx.params;
  const p = await ownedProject(a, id);
  await Task.deleteOne({ _id: oid(taskId), projectId: p._id });
  return ok({ ok: true });
});
