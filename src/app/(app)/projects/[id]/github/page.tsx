import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { fullDate, timeOfDay } from "@/lib/format";
import { parseRepo, recentCommits } from "@/lib/github";

export const metadata: Metadata = { title: "GitHub" };

export default async function GithubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const repo = parseRepo(p.repoUrl);
  const commits = repo ? await recentCommits(p.repoUrl, 25) : null;

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-col gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
      {!repo ? (
        <EmptyState
          icon="commit"
          title="No repository linked"
          action={
            <Link href={`/projects/${id}/settings`} className="btn-primary">
              Add repository URL
            </Link>
          }
        >
          Link a GitHub repository to see commits next to your tasks. Access is read-only; public repos work without a token.
        </EmptyState>
      ) : (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line-soft px-5 py-4">
            <Icon name="commit" className="text-muted" />
            <a href={p.repoUrl} target="_blank" rel="noreferrer" className="font-semibold">
              {repo.owner}/{repo.repo}
            </a>
            <span className="pill bg-chip text-ink-2">Read-only</span>
            <span className="flex-1" />
            <span className="text-xs text-muted">Cached for 5 minutes</span>
          </div>
          {!commits ? (
            <p className="m-0 px-5 py-8 text-center text-[13px] text-muted">Couldn&apos;t reach this repository. Private repositories need a read-only GITHUB_TOKEN in the server environment.</p>
          ) : (
            <ol className="m-0 list-none p-0">
              {commits.map((c) => (
                <li key={c.sha} className="flex items-start gap-3 border-b border-line-row px-5 py-3 last:border-0">
                  <Icon name="commit" className="mt-0.5 text-muted" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <a href={c.url} target="_blank" rel="noreferrer" className="leading-snug text-ink hover:text-brand">
                      {c.msg}
                    </a>
                    <span className="text-xs text-muted">
                      {c.author} · {fullDate(c.at)} {timeOfDay(c.at)}
                    </span>
                  </div>
                  <code className="code-chip">{c.sha}</code>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </main>
  );
}
