import Link from "next/link";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { STATUS_PILL } from "@/lib/catalog";
import { loadProject } from "@/lib/data";
import { parseRepo } from "@/lib/github";
import { ProjectTabs } from "./tabs";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const repo = parseRepo(p.repoUrl);
  return (
    <>
      <header className="flex flex-col gap-3 border-b border-line bg-white px-6 pt-3.5 max-sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: p.color }}>
              {p.name[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col">
              <Link href="/dashboard" className="text-xs text-muted hover:text-ink">
                Projects /
              </Link>
              <h1 className="m-0 flex items-center gap-2.5 text-lg font-bold tracking-[-0.01em]">
                {p.name} <span className={`pill ${STATUS_PILL[p.status]}`}>{p.status}</span>
              </h1>
            </div>
          </div>
          {repo && (
            <a href={p.repoUrl} target="_blank" rel="noreferrer" className="btn-secondary h-[34px]">
              <Icon name="commit" size={14} />
              {repo.owner}/{repo.repo}
            </a>
          )}
          <Link href={`/projects/${id}/assistant?q=resume`} className="btn-primary h-[34px]">
            <Icon name="sparkle" size={14} />
            Resume my work
          </Link>
        </div>
        <ProjectTabs id={id} />
      </header>
      {children}
    </>
  );
}
