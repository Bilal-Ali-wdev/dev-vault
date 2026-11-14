import { apiUser, handler, ok, ownedProject } from "@/lib/api";
import { parseRepo, recentCommits } from "@/lib/github";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const repo = parseRepo(p.repoUrl);
  if (!repo) return ok({ repo: null, commits: [] });
  const commits = await recentCommits(p.repoUrl, 20);
  return ok({ repo: `${repo.owner}/${repo.repo}`, commits: commits ?? [], error: commits ? null : "Couldn't reach this repository. Private repos need GITHUB_TOKEN." });
});
