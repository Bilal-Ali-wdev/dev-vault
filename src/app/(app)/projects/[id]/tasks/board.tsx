"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { TaskModal, type TaskDraft } from "@/components/task-modal";
import { api } from "@/components/ui";
import { PRIORITY_TEXT, TASK_COLUMNS } from "@/lib/catalog";
import { cn, dueLabel, fullDate } from "@/lib/format";

export type TaskDTO = { id: string; key: string; title: string; description: string; status: string; priority: string; tag: string; dueDate: string | null; aiSuggested: boolean; hasDoc: boolean; order: number };

export function Board({ projectId, initial, milestone }: { projectId: string; initial: TaskDTO[]; milestone: { name: string; dueDate?: string | null } | null }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initial);
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("All");
  const [modal, setModal] = useState<{ task?: TaskDraft | null; status?: string } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Keep in sync after server refreshes.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setTasks(initial);
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tasks.filter((t) => (prio === "All" || t.priority === prio) && (!term || `${t.key} ${t.title} ${t.tag}`.toLowerCase().includes(term)));
  }, [tasks, q, prio]);

  const done = tasks.filter((t) => t.status === "completed").length;
  const inProg = tasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  async function move(id: string, status: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    const prev = tasks;
    setTasks(tasks.map((x) => (x.id === id ? { ...x, status, aiSuggested: false } : x)));
    try {
      await api(`/api/projects/${projectId}/tasks/${id}`, { method: "PATCH", json: { status } });
      router.refresh();
    } catch (e) {
      setTasks(prev);
      setError((e as Error).message);
    }
  }

  const open = (t?: TaskDTO, status?: string) => setModal({ task: t ? { ...t } : null, status });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-6 py-3 max-sm:px-4">
        <div className="flex gap-0.5 rounded-[9px] bg-chip p-[3px]">
          {(["list", "board"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn("inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] capitalize", view === v ? "bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(15,23,42,.08)]" : "text-ink-3")}
            >
              <Icon name={v === "list" ? "list" : "board"} size={14} />
              {v}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-muted">
          <Icon name="search" size={14} />
          <span className="sr-only-x">Search tasks</span>
          <input placeholder="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} className="w-[130px] border-0 bg-transparent text-[13px] text-ink outline-none" />
        </label>
        <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink-2">
          <Icon name="filter" size={14} />
          <span className="sr-only-x">Priority</span>
          <select value={prio} onChange={(e) => setPrio(e.target.value)} className="bg-transparent outline-none">
            {["All", "Urgent", "High", "Normal", "Low"].map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => open()} className="btn-primary h-8 px-3">
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Add task
        </button>
      </div>

      {(milestone?.name || tasks.length > 0) && (
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 max-sm:px-4">
          <div className="flex items-center gap-2">
            <Icon name="flag" size={15} className="text-warn" />
            <span className="font-semibold">{milestone?.name || "All tasks"}</span>
            {milestone?.dueDate && <span className="text-[13px] text-muted">Due {fullDate(milestone.dueDate)}</span>}
          </div>
          <div className="flex h-2 max-w-[360px] min-w-[160px] flex-1 overflow-hidden rounded-full bg-line">
            <div className="bg-success-500" style={{ width: `${pct}%` }} />
            <div className="bg-brand-500" style={{ width: `${tasks.length ? Math.round((inProg / tasks.length) * 100) : 0}%` }} />
          </div>
          <span className="text-[13px] text-muted">
            {done} of {tasks.length} tasks done · {pct}%
          </span>
        </div>
      )}
      {error && <div className="mx-6 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</div>}

      {view === "board" ? (
        <div className="overflow-x-auto px-6 pb-8 max-sm:px-4">
          <div className="flex min-w-[1140px] items-start gap-3.5">
            {TASK_COLUMNS.map((col) => {
              const cards = filtered.filter((t) => t.status === col.id);
              return (
                <section
                  key={col.id}
                  aria-label={col.name}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(col.id);
                  }}
                  onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) move(dragId, col.id);
                    setDragId(null);
                    setOver(null);
                  }}
                  className={cn("flex min-w-[220px] flex-1 flex-col gap-2 rounded-xl bg-chip p-2.5 transition", over === col.id && "ring-2 ring-brand-500/50")}
                >
                  <div className="flex items-center gap-2 px-1 pt-0.5 pb-1">
                    <span className={cn("inline-flex h-[22px] items-center rounded-md px-2 text-[11px] font-bold tracking-[0.04em] uppercase", col.chip)}>{col.name}</span>
                    <span className="text-xs font-medium text-muted">{cards.length}</span>
                    <span className="flex-1" />
                    <button type="button" aria-label={`Add task to ${col.name}`} onClick={() => open(undefined, col.id)} className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-white">
                      <Icon name="plus" size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                  {cards.map((c) => (
                    <article
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn("flex flex-col gap-2.5 rounded-[10px] border border-line bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,.04)]", dragId === c.id && "opacity-50")}
                    >
                      {c.aiSuggested && (
                        <span className="inline-flex items-center gap-1 self-start rounded-[5px] bg-warn-50 px-[7px] py-0.5 text-[11px] font-semibold text-warn">
                          <Icon name="sparkle" size={11} strokeWidth={2.4} />
                          AI suggested · needs review
                        </span>
                      )}
                      <button type="button" onClick={() => open(c)} className="flex flex-col gap-1 text-left">
                        <span className="font-mono text-xs text-muted">{c.key}</span>
                        <span className="leading-snug font-semibold">{c.title}</span>
                      </button>
                      {c.tag && <span className="self-start rounded-[5px] bg-chip px-[7px] py-0.5 text-[11px] font-medium text-ink-2">{c.tag}</span>}
                      <div className="flex items-center gap-2.5 text-xs text-muted">
                        <span className={cn("inline-flex items-center gap-1 font-semibold", PRIORITY_TEXT[c.priority])}>
                          <Icon name="flag" size={12} strokeWidth={2.2} />
                          {c.priority}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="clock" size={12} />
                          {dueLabel(c.dueDate)}
                        </span>
                        <span className="flex-1" />
                        {c.hasDoc && (
                          <span className="inline-flex items-center gap-0.5" title="Linked documentation">
                            <Icon name="doc" size={12} />
                            Doc
                          </span>
                        )}
                        <label className="sr-only-x">
                          Move {c.key}
                          <select value={c.status} onChange={(e) => move(c.id, e.target.value)}>
                            {TASK_COLUMNS.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}
                  <button type="button" onClick={() => open(undefined, col.id)} className="inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 text-left text-[13px] text-muted hover:bg-white">
                    <Icon name="plus" size={13} strokeWidth={2.2} />
                    New task
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-6 pb-8 max-sm:px-4">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FBFBFC] text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Task</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Priority</th>
                  <th className="px-3 py-2.5 font-medium">Tag</th>
                  <th className="px-3 py-2.5 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-line-row hover:bg-[#FBFCFC]">
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => open(t)} className="flex items-center gap-2 text-left">
                        <span className="font-mono text-xs text-muted">{t.key}</span>
                        <span className="font-medium">{t.title}</span>
                        {t.aiSuggested && <Icon name="sparkle" size={12} className="text-warn" />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <select aria-label={`Status of ${t.key}`} value={t.status} onChange={(e) => move(t.id, e.target.value)} className="rounded-md border border-line bg-white px-1.5 py-1 text-xs">
                        {TASK_COLUMNS.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={cn("px-3 py-2.5 font-semibold", PRIORITY_TEXT[t.priority])}>{t.priority}</td>
                    <td className="px-3 py-2.5 text-ink-2">{t.tag || "—"}</td>
                    <td className="px-3 py-2.5 text-muted">{dueLabel(t.dueDate)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No tasks yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskModal key={modal ? (modal.task?.id ?? `new-${modal.status ?? "todo"}`) : "closed"} open={!!modal}onClose={() => setModal(null)} projectId={projectId} task={modal?.task} defaultStatus={modal?.status} onSaved={() => router.refresh()} />
    </>
  );
}
