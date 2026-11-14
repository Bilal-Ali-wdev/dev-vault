import "server-only";

export type Commit = { sha: string; msg: string; repo: string; at: string; url: string; author: string };

const cache = new Map<string, { at: number; data: Commit[] | null }>();
const TTL = 5 * 60 * 1000;

export function parseRepo(url?: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  const m = url.trim().match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** Read-only commit listing via the public GitHub REST API (token optional). */
export async function recentCommits(repoUrl: string, limit = 8): Promise<Commit[] | null> {
  const r = parseRepo(repoUrl);
  if (!r) return null;
  const k = `${r.owner}/${r.repo}`;
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "devvault-app" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${k}/commits?per_page=${limit}`, { headers, signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) {
      cache.set(k, { at: Date.now(), data: null });
      return null;
    }
    const json = (await res.json()) as { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } }[];
    const data = json.map((c) => ({
      sha: c.sha.slice(0, 7),
      msg: c.commit.message.split("\n")[0].slice(0, 120),
      repo: r.repo,
      at: c.commit.author.date,
      url: c.html_url,
      author: c.commit.author.name,
    }));
    cache.set(k, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}
