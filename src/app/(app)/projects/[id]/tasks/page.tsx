import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { Task, type ITask } from "@/lib/models";
import { Board, type TaskDTO } from "./board";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const tasks = await Task.find({ projectId: p._id }).sort({ order: 1, createdAt: -1 }).lean<ITask[]>();
  const dto: TaskDTO[] = tasks.map((t) => ({
    id: String(t._id),
    key: t.key,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    tag: t.tag,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    aiSuggested: t.aiSuggested,
    hasDoc: t.hasDoc,
    order: t.order,
  }));
  const milestone = p.milestone?.name ? { name: p.milestone.name, dueDate: p.milestone.dueDate ? new Date(p.milestone.dueDate).toISOString() : null } : null;
  return <Board projectId={id} initial={dto} milestone={milestone} />;
}
