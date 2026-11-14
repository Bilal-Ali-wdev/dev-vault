import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, TopBar } from "@/components/page-header";
import { Dot } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PRIORITY_PILL, TASK_COLUMNS } from "@/lib/catalog";
import { byPriorityThenDue } from "@/lib/data";
import { dueLabel } from "@/lib/format";
import { Project, Task, type IProject, type ITask } from "@/lib/models";

export const metadata: Metadata = { title: "My tasks" };

export default async function MyTasksPage() {
  const { user } = await requireUser();
  const [tasks, projects] = await Promise.all([Task.find({ userId: user._id, status: { $ne: "completed" } }).lean<ITask[]>(), Project.find({ userId: user._id }).select("name color").lean<IProject[]>()]);
  const pm = new Map(projects.map((p) => [String(p._id), p]));
  const sorted = tasks.sort(byPriorityThenDue);
  const overdue = sorted.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0));
  const groups = [
    { name: "Overdue", items: overdue },
    { name: "Open", items: sorted.filter((t) => !overdue.includes(t)) },
  ].filter((g) => g.items.length);

  return (
    <>
      <TopBar icon="checkbox" title={<span className="font-semibold">My tasks</span>}>
        <span className="text-xs text-muted">{tasks.length} open across all projects</span>
      </TopBar>
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-[18px] px-6 pt-7 pb-10 max-sm:px-4">
        {tasks.length === 0 ? (
          <EmptyState icon="checkbox" title="No open tasks">
            Tasks you add to any project&apos;s board show up here, sorted by priority and due date.
          </EmptyState>
        ) : (
          groups.map((g) => (
            <section key={g.name} className="card overflow-hidden">
              <h2 className="m-0 border-b border-line-soft px-5 py-3 text-[13px] font-semibold">
                {g.name} <span className="font-normal text-muted">· {g.items.length}</span>
              </h2>
              <ul className="m-0 list-none p-0">
                {g.items.map((t) => {
                  const p = pm.get(String(t.projectId));
                  return (
                    <li key={String(t._id)} className="border-b border-line-row last:border-0">
                      <Link href={`/projects/${t.projectId}/tasks`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-ink hover:bg-[#FBFCFC] hover:text-ink">
                        <span className="w-16 font-mono text-xs text-muted">{t.key}</span>
                        <span className="min-w-[200px] flex-1 font-medium">{t.title}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <Dot color={p?.color ?? "#94A3B8"} size={8} />
                          {p?.name}
                        </span>
                        <span className="text-xs text-muted">{TASK_COLUMNS.find((c) => c.id === t.status)?.name}</span>
                        <span className="w-20 text-xs text-muted">{dueLabel(t.dueDate)}</span>
                        <span className={`pill ${PRIORITY_PILL[t.priority]}`}>{t.priority}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>
    </>
  );
}
