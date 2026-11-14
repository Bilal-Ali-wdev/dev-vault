import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadProject, plain, progressOf } from "@/lib/data";
import { Conversation, Task, type IConversation, type ITask } from "@/lib/models";
import { Assistant } from "./assistant";

export const metadata: Metadata = { title: "AI assistant" };

export default async function AssistantPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ c?: string; q?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const [convos, tasks] = await Promise.all([
    Conversation.find({ projectId: p._id, userId: user._id }).sort({ updatedAt: -1 }).limit(30).lean<IConversation[]>(),
    Task.find({ projectId: p._id }).select("status").lean<ITask[]>(),
  ]);
  const current = sp.c ? convos.find((c) => String(c._id) === sp.c) : undefined;
  return (
    <Assistant
      key={sp.c ?? "new"}
      project={{ id, name: p.name, color: p.color, milestone: p.milestone?.name ?? null }}
      snapshot={{ pct: progressOf(tasks), open: tasks.filter((t) => t.status !== "completed").length, blocked: tasks.filter((t) => t.status === "blocked").length }}
      conversations={convos.map((c) => ({ id: String(c._id), title: c.title, updatedAt: new Date(c.updatedAt).toISOString() }))}
      initial={current ? plain({ id: String(current._id), messages: current.messages }) : null}
      autoAsk={sp.q === "resume" && !current ? "Where did I stop working on this project, and what should I do next?" : null}
    />
  );
}
