import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState, TopBar } from "@/components/page-header";
import { StartSessionButton } from "@/components/session-modals";
import { Dot } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PRIORITY_PILL } from "@/lib/catalog";
import { byPriorityThenDue, plain, progressOf } from "@/lib/data";
import { daysAgo, daysSince, dueLabel, duration, greeting, plural, relativeDay, shortDate, timeOfDay } from "@/lib/format";
import { recentCommits } from "@/lib/github";
import { Project, Task, WorkSession, type IProject, type ITask, type IWorkSession } from "@/lib/models";
import { ProjectsTable, type ProjectRow } from "./projects-table";
import { ResumeSuggestion } from "./resume-suggestion";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await requireUser();
  const [projects, tasks, sessions] = await Promise.all([
    Project.find({ userId: user._id }).sort({ lastWorkedAt: -1, updatedAt: -1 }).lean<IProject[]>(),
    Task.find({ userId: user._id }).lean<ITask[]>(),
    WorkSession.find({ userId: user._id }).sort({ startedAt: -1 }).limit(30).lean<IWorkSession[]>(),
  ]);
  const byProject = new Map(projects.map((p) => [String(p._id), p]));
  const tasksOf = (id: string) => tasks.filter((t) => String(t.projectId) === id);
  const open = tasks.filter((t) => t.status !== "completed");
  const active = projects.filter((p) => p.status === "Active");
  const paused = projects.filter((p) => p.status === "Paused" || p.status === "On Hold");
  const completed = projects.filter((p) => p.status === "Completed");
  const monthAgo = daysAgo(30);
  const weekAgo = daysAgo(7);
  const running = sessions.find((s) => !s.endedAt);

  const rows: ProjectRow[] = projects.map((p) => {
    const ts = tasksOf(String(p._id));
    const next = ts.filter((t) => t.status !== "completed").sort(byPriorityThenDue)[0];
    return {
      id: String(p._id),
      name: p.name,
      desc: p.description,
      color: p.color,
      status: p.status,
      stack: p.stack.slice(0, 3).join(" · ") || "—",
      pct: progressOf(ts),
      next: next?.title ?? "—",
      last: relativeDay(p.lastWorkedAt ?? p.updatedAt),
      lastTs: new Date(p.lastWorkedAt ?? p.updatedAt).getTime(),
      gh: !!p.repoUrl,
    };
  });

  // Resume my work: most recently worked project.
  const focus = projects[0];
  const focusId = focus ? String(focus._id) : "";
  const lastSession = sessions.find((s) => String(s.projectId) === focusId && s.endedAt);
  const lastDone = tasksOf(focusId)
    .filter((t) => t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

  const pending = open.sort(byPriorityThenDue).slice(0, 5);
  const ghProjects = projects.filter((p) => p.repoUrl).slice(0, 3);
  const commits = (await Promise.all(ghProjects.map((p) => recentCommits(p.repoUrl, 4))))
    .flatMap((c) => c ?? [])
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);
  const recent = sessions.filter((s) => s.endedAt).slice(0, 4);
  const oldestPaused = paused.reduce((m, p) => Math.max(m, daysSince(p.lastWorkedAt ?? p.updatedAt)), 0);

  const stats = [
    { label: "Total projects", value: projects.length, note: `${projects.filter((p) => new Date(p.createdAt).getTime() > monthAgo).length} added this month`, dot: "#94A3B8" },
    { label: "Active", value: active.length, note: `${active.filter((p) => p.lastWorkedAt && new Date(p.lastWorkedAt).getTime() > weekAgo).length} worked on this week`, dot: "#0A8D7C" },
    { label: "Paused", value: paused.length, note: paused.length ? `Oldest paused ${oldestPaused} days` : "Nothing on hold", dot: "#F6921E" },
    { label: "Completed", value: completed.length, note: completed.length ? `Last shipped ${shortDate(completed[0].updatedAt)}` : "Ship your first one", dot: "#39AA70" },
  ];

  return (
    <>
      <TopBar
        icon="home"
        title={
          <>
            <span className="font-semibold">Home</span>
            <span className="text-muted">·</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="h-[7px] w-[7px] rounded-full bg-success-500" />
              All changes synced
            </span>
          </>
        }
      >
        <Link href="/projects/new" className="btn-primary">
          <Icon name="plus" size={15} strokeWidth={2.4} />
          New project
        </Link>
        <div aria-label={`Signed in as ${user.name}`} role="img" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-orange text-[13px] font-bold text-ink">
          {user.name[0]?.toUpperCase()}
        </div>
      </TopBar>

      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-[22px] px-6 pt-7 pb-10 max-sm:px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-2xl font-bold tracking-[-0.02em]">
              {greeting()}, {user.name.split(" ")[0]}
            </h1>
            <p className="m-0 text-muted">
              {projects.length ? `You have ${plural(active.length, "active project")} and ${plural(open.length, "open task")}. Here's where you left off.` : "Create a project to start tracking tasks, sessions and secrets."}
            </p>
          </div>
          <StartSessionButton projects={projects.map((p) => ({ id: String(p._id), name: p.name }))} disabled={!!running || !projects.length} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-white px-[18px] py-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted">{s.label}</span>
                <Dot color={s.dot} />
              </div>
              <span className="text-[28px] font-bold tracking-[-0.02em]">{s.value}</span>
              <span className="text-xs text-muted">{s.note}</span>
            </div>
          ))}
        </div>

        {!projects.length ? (
          <EmptyState
            icon="folder"
            title="No projects yet"
            action={
              <Link href="/projects/new" className="btn-primary">
                <Icon name="plus" size={15} />
                New project
              </Link>
            }
          >
            Add a project with its stack and third-party services. DevVault will remember tasks, sessions and secrets for it.
          </EmptyState>
        ) : (
          <div className="flex flex-wrap items-start gap-[18px]">
            <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
              {/* Resume my work */}
              <section aria-labelledby="resume-h" className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand">
                      <Icon name="sparkle" />
                    </div>
                    <div className="flex flex-col">
                      <h2 id="resume-h" className="m-0 text-[15px] font-semibold">
                        Resume my work
                      </h2>
                      <span className="text-xs text-muted">
                        {focus.name} ·{" "}
                        {lastSession ? `last session ${relativeDay(lastSession.startedAt).toLowerCase()}, ${timeOfDay(lastSession.startedAt)} – ${timeOfDay(lastSession.endedAt!)}` : "no sessions logged yet"}
                      </span>
                    </div>
                  </div>
                  <Link href={`/projects/${focusId}/assistant`} className="btn-primary h-8 px-3">
                    Open project
                    <Icon name="arrowRight" size={14} strokeWidth={2.2} />
                  </Link>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                  <div className="flex flex-col gap-3.5 border-r border-line-soft px-5 py-[18px]">
                    <span className="eyebrow bg-line-soft text-ink-2">From your records</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Last completed task</span>
                      <span className="font-medium">{lastDone ? lastDone.title : "Nothing completed yet"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Recently worked on</span>
                      {lastSession?.files.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {lastSession.files.slice(0, 4).map((f) => (
                            <code key={f} className="code-chip">
                              {f}
                            </code>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[13px] text-muted">{lastSession?.summary || "Log a session to see files here."}</span>
                      )}
                    </div>
                    {lastSession?.blockers && (
                      <div className="flex items-start gap-2.5 rounded-lg bg-danger-50 px-3 py-2.5">
                        <Icon name="alert" className="mt-px text-danger" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-danger">Known blocker</span>
                          <span className="text-[13px]">{lastSession.blockers}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <ResumeSuggestion projectId={focusId} />
                </div>
              </section>

              <ProjectsTable rows={plain(rows)} />
            </div>

            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
              <section aria-labelledby="tasks-h" className="card flex flex-col gap-3 px-[18px] py-4">
                <div className="flex items-center justify-between">
                  <h2 id="tasks-h" className="m-0 text-[15px] font-semibold">
                    Pending tasks
                  </h2>
                  <Link href="/tasks" className="text-xs font-semibold">
                    View all
                  </Link>
                </div>
                {pending.length === 0 && <p className="m-0 text-[13px] text-muted">No open tasks. Nice.</p>}
                {pending.map((t) => (
                  <Link key={String(t._id)} href={`/projects/${t.projectId}/tasks`} className="flex items-start gap-2.5 text-ink hover:text-ink">
                    <span className="mt-0.5 h-4 w-4 flex-none rounded-[5px] border-[1.5px] border-[#CBD2DA]" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="leading-snug font-medium">{t.title}</span>
                      <span className="text-xs text-muted">
                        {byProject.get(String(t.projectId))?.name} · {t.dueDate ? `Due ${dueLabel(t.dueDate).toLowerCase()}` : t.key}
                      </span>
                    </div>
                    <span className={`pill ${PRIORITY_PILL[t.priority]}`}>{t.priority}</span>
                  </Link>
                ))}
              </section>

              <section aria-labelledby="gh-h" className="card flex flex-col gap-3 px-[18px] py-4">
                <div className="flex items-center justify-between">
                  <h2 id="gh-h" className="m-0 text-[15px] font-semibold">
                    GitHub activity
                  </h2>
                  <span className="text-xs text-muted">Read-only</span>
                </div>
                {commits.length === 0 && <p className="m-0 text-[13px] leading-normal text-muted">Add a GitHub repository URL to a project to see recent commits here.</p>}
                {commits.map((c) => (
                  <a key={c.sha + c.repo} href={c.url} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 text-ink hover:text-ink">
                    <Icon name="commit" className="mt-0.5 text-muted" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="leading-snug">{c.msg}</span>
                      <span className="text-xs text-muted">
                        <span className="font-mono">{c.sha}</span> · {c.repo} · {relativeDay(c.at) === "Today" ? timeOfDay(c.at) : shortDate(c.at)}
                      </span>
                    </div>
                  </a>
                ))}
              </section>

              <section aria-labelledby="sess-h" className="card flex flex-col gap-3 px-[18px] py-4">
                <h2 id="sess-h" className="m-0 text-[15px] font-semibold">
                  Recent sessions
                </h2>
                {recent.length === 0 && <p className="m-0 text-[13px] text-muted">Start a session to log what you work on.</p>}
                {recent.map((s) => {
                  const p = byProject.get(String(s.projectId));
                  return (
                    <Link key={String(s._id)} href={`/projects/${s.projectId}/sessions`} className="flex items-center gap-3 text-ink hover:text-ink">
                      <Dot color={p?.color ?? "#94A3B8"} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium">{p?.name}</span>
                        <span className="truncate text-xs text-muted">{s.summary || "No summary"}</span>
                      </div>
                      <span className="text-xs whitespace-nowrap text-muted">{duration(new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime())}</span>
                    </Link>
                  );
                })}
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
