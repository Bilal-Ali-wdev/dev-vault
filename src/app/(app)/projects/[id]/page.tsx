import Link from "next/link";
import { Icon } from "@/components/icons";
import { StartSessionButton } from "@/components/session-modals";
import { requireUser } from "@/lib/auth";
import { byPriorityThenDue, loadProject, progressOf } from "@/lib/data";
import { duration, fullDate, relativeDay, timeOfDay } from "@/lib/format";
import { Doc, Secret, Service, Task, WorkSession, type ITask, type IWorkSession } from "@/lib/models";
import { ResumeSuggestion } from "../../dashboard/resume-suggestion";

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const [tasks, sessions, secrets, services, docs, running] = await Promise.all([
    Task.find({ projectId: p._id }).lean<ITask[]>(),
    WorkSession.find({ projectId: p._id }).sort({ startedAt: -1 }).limit(5).lean<IWorkSession[]>(),
    Secret.countDocuments({ projectId: p._id }),
    Service.countDocuments({ projectId: p._id }),
    Doc.countDocuments({ projectId: p._id }),
    WorkSession.exists({ userId: user._id, endedAt: null }),
  ]);
  const open = tasks.filter((t) => t.status !== "completed");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const pct = progressOf(tasks);
  const last = sessions.find((s) => s.endedAt);
  const next = open.sort(byPriorityThenDue).slice(0, 4);

  const tiles = [
    { l: "Progress", v: `${pct}%`, href: "tasks" },
    { l: "Open tasks", v: open.length, href: "tasks" },
    { l: "Blocked", v: blocked.length, href: "tasks" },
    { l: "Secrets", v: secrets, href: "vault" },
    { l: "Services", v: services, href: "services" },
    { l: "Docs", v: docs, href: "docs" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1">
          <p className="m-0 leading-normal text-ink-2">{p.description || "No description yet."}</p>
          <span className="text-xs text-muted">
            {p.type} · {p.stack.join(" · ") || "Stack not set"}
            {p.liveUrl && (
              <>
                {" · "}
                <a href={p.liveUrl} target="_blank" rel="noreferrer">
                  {p.liveUrl.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </span>
        </div>
        <StartSessionButton projectId={id} disabled={!!running} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {tiles.map((t) => (
          <Link key={t.l} href={`/projects/${id}/${t.href}`} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white px-4 py-3.5 text-ink hover:border-brand-500/50 hover:text-ink">
            <span className="text-xs font-medium text-muted">{t.l}</span>
            <span className="text-2xl font-bold tracking-[-0.02em]">{t.v}</span>
          </Link>
        ))}
      </div>

      {p.milestone?.name && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Icon name="flag" size={15} className="text-warn" />
            <span className="font-semibold">{p.milestone.name}</span>
            {p.milestone.dueDate && <span className="text-[13px] text-muted">Due {fullDate(p.milestone.dueDate)}</span>}
          </div>
          <div className="h-2 max-w-[360px] min-w-[160px] flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-2 bg-success-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[13px] text-muted">
            {tasks.length - open.length} of {tasks.length} tasks done · {pct}%
          </span>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand">
            <Icon name="sparkle" />
          </div>
          <div className="flex flex-col">
            <h2 className="m-0 text-[15px] font-semibold">Resume my work</h2>
            <span className="text-xs text-muted">{last ? `Last session ${relativeDay(last.startedAt).toLowerCase()}, ${timeOfDay(last.startedAt)} – ${timeOfDay(last.endedAt!)}` : "No sessions logged yet"}</span>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div className="flex flex-col gap-3.5 border-r border-line-soft px-5 py-[18px]">
            <span className="eyebrow bg-line-soft text-ink-2">From your records</span>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">Last session summary</span>
              <span className="font-medium">{last?.summary || "—"}</span>
            </div>
            {last?.nextStep && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted">You planned to</span>
                <span className="font-medium">{last.nextStep}</span>
              </div>
            )}
            {last?.blockers && (
              <div className="flex items-start gap-2.5 rounded-lg bg-danger-50 px-3 py-2.5">
                <Icon name="alert" className="mt-px text-danger" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-danger">Known blocker</span>
                  <span className="text-[13px]">{last.blockers}</span>
                </div>
              </div>
            )}
          </div>
          <ResumeSuggestion projectId={id} />
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[18px]">
        <section className="card flex flex-col gap-3 px-[18px] py-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-semibold">Up next</h2>
            <Link href={`/projects/${id}/tasks`} className="text-xs font-semibold">
              Board
            </Link>
          </div>
          {next.length === 0 && <p className="m-0 text-[13px] text-muted">No open tasks.</p>}
          {next.map((t) => (
            <div key={String(t._id)} className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-muted">{t.key}</span>
              <span className="flex-1 truncate font-medium">{t.title}</span>
              <span className="text-xs text-muted">{t.priority}</span>
            </div>
          ))}
        </section>
        <section className="card flex flex-col gap-3 px-[18px] py-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-semibold">Recent sessions</h2>
            <Link href={`/projects/${id}/sessions`} className="text-xs font-semibold">
              All sessions
            </Link>
          </div>
          {sessions.length === 0 && <p className="m-0 text-[13px] text-muted">No sessions yet.</p>}
          {sessions.map((s) => (
            <div key={String(s._id)} className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-muted">#{s.number}</span>
              <span className="flex-1 truncate">{s.summary || (s.endedAt ? "No summary" : "In progress…")}</span>
              <span className="text-xs whitespace-nowrap text-muted">{s.endedAt ? duration(new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) : "Running"}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
