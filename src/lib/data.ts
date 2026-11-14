import "server-only";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { Project, Task, WorkSession, type IProject, type ITask, type IWorkSession } from "./models";

export type NavProject = { id: string; name: string; color: string };

export async function navData(userId: Types.ObjectId) {
  const [projects, openTasks, active] = await Promise.all([
    Project.find({ userId }).sort({ lastWorkedAt: -1, updatedAt: -1 }).select("name color").lean<IProject[]>(),
    Task.countDocuments({ userId, status: { $ne: "completed" } }),
    WorkSession.findOne({ userId, endedAt: null }).lean<IWorkSession>(),
  ]);
  const activeProject = active ? projects.find((p) => String(p._id) === String(active.projectId)) : null;
  return {
    projects: projects.map((p) => ({ id: String(p._id), name: p.name, color: p.color })),
    openTasks,
    active: active && activeProject ? { id: String(active._id), projectId: String(active.projectId), projectName: activeProject.name, color: activeProject.color, startedAt: new Date(active.startedAt).toISOString() } : null,
  };
}

export async function loadProject(userId: Types.ObjectId, id: string): Promise<IProject> {
  if (!Types.ObjectId.isValid(id)) notFound();
  const p = await Project.findOne({ _id: id, userId }).lean<IProject>();
  if (!p) notFound();
  return p;
}

export function progressOf(tasks: Pick<ITask, "status">[]) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100);
}

const PRIO_RANK: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
export function byPriorityThenDue(a: ITask, b: ITask) {
  const p = PRIO_RANK[a.priority] - PRIO_RANK[b.priority];
  if (p) return p;
  const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return ad - bd;
}

/** Plain-JSON copies for passing to client components. */
export function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
