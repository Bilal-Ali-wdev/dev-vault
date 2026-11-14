"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Dot } from "@/components/ui";
import { STATUS_BAR, STATUS_PILL } from "@/lib/catalog";

export type ProjectRow = { id: string; name: string; desc: string; color: string; status: string; stack: string; pct: number; next: string; last: string; lastTs: number; gh: boolean };

const STATUSES = ["All", "Active", "Planning", "Paused", "On Hold", "Completed"];
const SORTS = { last: "Last worked", name: "Name", progress: "Progress" } as const;

export function ProjectsTable({ rows }: { rows: ProjectRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<keyof typeof SORTS>("last");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => status === "All" || r.status === status)
      .filter((r) => !term || `${r.name} ${r.desc} ${r.stack}`.toLowerCase().includes(term))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "progress" ? b.pct - a.pct : b.lastTs - a.lastTs));
  }, [rows, q, status, sort]);

  return (
    <section aria-labelledby="projects-h" className="card">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line-soft px-5 py-3.5">
        <h2 id="projects-h" className="m-0 flex-1 text-[15px] font-semibold">
          Projects
        </h2>
        <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-muted">
          <Icon name="search" size={14} />
          <span className="sr-only-x">Search projects</span>
          <input placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} className="w-[140px] border-0 bg-transparent text-[13px] text-ink outline-none" />
        </label>
        <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink-2">
          <Icon name="filter" size={14} />
          <span className="sr-only-x">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent outline-none">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-8 items-center rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink-2">
          <span className="sr-only-x">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="bg-transparent outline-none">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                Sort: {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="border-b border-line-soft px-5 py-2.5 font-medium">Name</th>
              <th className="border-b border-line-soft px-3 py-2.5 font-medium">Status</th>
              <th className="border-b border-line-soft px-3 py-2.5 font-medium">Stack</th>
              <th className="w-[140px] border-b border-line-soft px-3 py-2.5 font-medium">Progress</th>
              <th className="border-b border-line-soft px-3 py-2.5 font-medium">Next task</th>
              <th className="border-b border-line-soft px-3 py-2.5 font-medium">Last worked</th>
              <th className="border-b border-line-soft py-2.5 pr-5 pl-3 font-medium">GitHub</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="hover:bg-[#FBFCFC]">
                <td className="border-b border-line-row px-5 py-3">
                  <Link href={`/projects/${p.id}`} className="flex items-center gap-2.5 font-semibold text-ink hover:text-ink">
                    <Dot color={p.color} />
                    <span className="flex flex-col">
                      <span>{p.name}</span>
                      {p.desc && <span className="max-w-[220px] truncate text-xs font-normal text-muted">{p.desc}</span>}
                    </span>
                  </Link>
                </td>
                <td className="border-b border-line-row p-3">
                  <span className={`pill ${STATUS_PILL[p.status]}`}>{p.status}</span>
                </td>
                <td className="border-b border-line-row p-3 text-ink-2">{p.stack}</td>
                <td className="border-b border-line-row p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-line-soft">
                      <div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: STATUS_BAR[p.status] }} />
                    </div>
                    <span className="w-8 text-xs text-muted">{p.pct}%</span>
                  </div>
                </td>
                <td className="border-b border-line-row p-3 text-ink-2">{p.next}</td>
                <td className="border-b border-line-row p-3 whitespace-nowrap text-muted">{p.last}</td>
                <td className="border-b border-line-row py-3 pr-5 pl-3">
                  {p.gh ? <span className="pill bg-chip text-ink-2">Connected</span> : <span className="pill border border-dashed border-[#CBD2DA] bg-white text-muted">Not connected</span>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  No projects match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2.5 text-xs text-muted">Progress is calculated from completed tasks — not commit counts.</div>
    </section>
  );
}
