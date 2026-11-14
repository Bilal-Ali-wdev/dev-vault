import { z } from "zod";
import { apiUser, body, handler, ok, ownedProject } from "@/lib/api";
import { Project, Task, TASK_PRIORITIES, TASK_STATUSES, type IProject, type ITask } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

const TaskInput = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(300),
  description: z.string().max(5000).default(""),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(TASK_PRIORITIES).default("Normal"),
  tag: z.string().trim().max(40).default(""),
  dueDate: z.string().nullable().optional(),
  aiSuggested: z.boolean().default(false),
  hasDoc: z.boolean().default(false),
});

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const tasks = await Task.find({ projectId: p._id }).sort({ order: 1, createdAt: -1 }).lean<ITask[]>();
  return ok({ tasks });
});

export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const input = await body(req, TaskInput);
  const updated = await Project.findOneAndUpdate({ _id: p._id }, { $inc: { taskCounter: 1 }, $set: { lastWorkedAt: new Date() } }, { new: true }).lean<IProject>();
  const number = updated!.taskCounter;
  const task = await Task.create({
    ...input,
    userId: a.user._id,
    projectId: p._id,
    number,
    key: `${p.key}-${number}`,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    completedAt: input.status === "completed" ? new Date() : null,
    order: -Date.now(),
  });
  return ok({ task: task.toObject() }, { status: 201 });
});
