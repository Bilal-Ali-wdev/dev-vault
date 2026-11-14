import "server-only";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { Runnable } from "@langchain/core/runnables";
import { z } from "zod";
import { Doc, Service, Task, WorkSession, type IDoc, type IProject, type IService, type ISource, type ITask, type IWorkSession } from "./models";
import { recentCommits, type Commit } from "./github";
import { duration, fullDate, timeOfDay } from "./format";
import { sha256 } from "./crypto";

/* ---------------------------------------------------------------- Models */

function chat(model: string) {
  return new ChatGoogleGenerativeAI({
    model,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    maxRetries: 1,
  });
}

function modelNames() {
  const primary = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return [primary, ...fallbacks.filter((f) => f !== primary)];
}

type AnyRunnable = Runnable<unknown, unknown>;
type StructuredCapable = { withStructuredOutput: (schema: unknown, opts: { name: string }) => AnyRunnable };

/**
 * Structured-output runnable with automatic fallback to other Gemini models (e.g. on 503 overload).
 * Typed at the boundary on purpose: LangChain's generic inference over zod schemas can exhaust tsc's memory.
 */
function structured(schema: z.ZodType, name: string): AnyRunnable {
  const [first, ...rest] = modelNames().map((m) => (chat(m) as unknown as StructuredCapable).withStructuredOutput(schema, { name }));
  return rest.length ? (first.withFallbacks(rest) as AnyRunnable) : first;
}

export function aiConfigured() {
  return !!process.env.GOOGLE_API_KEY;
}

/* ------------------------------------------------------------- Retrieval */

type Record_ = { kind: "Session" | "Task" | "Doc" | "Service" | "Commit" | "Project"; label: string; href: string; text: string; at: number; ctx: string };

const STOP = new Set("the a an and or of to in on for is are was were what which where when how did do does i my me this that it with from be at by as about should next".split(" "));
function terms(s: string) {
  return s.toLowerCase().split(/[^a-z0-9_./-]+/).filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Gather project records. Vault values, database URLs and MFA data are never loaded here,
 * so they can't reach a prompt.
 */
async function projectRecords(p: IProject): Promise<Record_[]> {
  const base = `/projects/${p._id}`;
  const [sessions, tasks, docs, services, commits] = await Promise.all([
    WorkSession.find({ projectId: p._id }).sort({ startedAt: -1 }).limit(15).lean<IWorkSession[]>(),
    Task.find({ projectId: p._id }).sort({ updatedAt: -1 }).limit(60).lean<ITask[]>(),
    Doc.find({ projectId: p._id }).sort({ updatedAt: -1 }).limit(20).lean<IDoc[]>(),
    Service.find({ projectId: p._id }).lean<IService[]>(),
    p.repoUrl ? recentCommits(p.repoUrl, 10) : Promise.resolve(null as Commit[] | null),
  ]);
  const out: Record_[] = [];
  out.push({
    kind: "Project",
    label: p.name,
    href: base,
    at: new Date(p.updatedAt).getTime(),
    ctx: "Architecture record",
    text: `Project "${p.name}" (${p.type}), status ${p.status}. Stack: ${p.stack.join(", ") || "not set"}. ${p.description}${p.milestone?.name ? ` Milestone: ${p.milestone.name}${p.milestone.dueDate ? " due " + fullDate(p.milestone.dueDate) : ""}.` : ""}`,
  });
  for (const s of sessions) {
    const end = s.endedAt ? new Date(s.endedAt) : null;
    out.push({
      kind: "Session",
      label: `#${s.number} · ${fullDate(s.startedAt)}`,
      href: `${base}/sessions`,
      at: new Date(s.startedAt).getTime(),
      ctx: "Work sessions",
      text: `Work session #${s.number} on ${fullDate(s.startedAt)} ${timeOfDay(s.startedAt)}${end ? ` – ${timeOfDay(end)} (${duration(end.getTime() - new Date(s.startedAt).getTime())})` : " (still active)"}. Summary: ${s.summary || "none"}. Files: ${s.files.join(", ") || "none"}. Blockers: ${s.blockers || "none"}. Planned next step: ${s.nextStep || "none"}.`,
    });
  }
  for (const t of tasks) {
    out.push({
      kind: "Task",
      label: `${t.key} · ${t.status.replace("_", " ")}`,
      href: `${base}/tasks`,
      at: new Date(t.updatedAt).getTime(),
      ctx: "Tasks",
      text: `Task ${t.key} "${t.title}" — status ${t.status}, priority ${t.priority}${t.tag ? `, tag ${t.tag}` : ""}${t.dueDate ? `, due ${fullDate(t.dueDate)}` : ""}${t.completedAt ? `, completed ${fullDate(t.completedAt)}` : ""}. ${t.description}`,
    });
  }
  for (const d of docs) {
    const chunks = d.content.split(/\n{2,}/).reduce<string[]>((acc, para) => {
      const last = acc[acc.length - 1];
      if (last && last.length + para.length < 900) acc[acc.length - 1] = last + "\n\n" + para;
      else acc.push(para);
      return acc;
    }, []);
    chunks.slice(0, 12).forEach((c) =>
      out.push({ kind: "Doc", label: d.title, href: `${base}/docs`, at: new Date(d.updatedAt).getTime(), ctx: `Docs: ${d.title}`, text: `${d.kind === "architecture" ? "Architecture doc" : "Doc"} "${d.title}": ${c}` })
    );
  }
  for (const s of services) {
    out.push({
      kind: "Service",
      label: s.name,
      href: `${base}/services`,
      at: new Date(s.createdAt).getTime(),
      ctx: "Third-party services",
      text: `Service ${s.name} (${s.category}) used for ${s.usedFor || "unspecified"}; account ${s.accountEmail || "not recorded"} via ${s.signInWith}; plan ${s.plan || "unknown"}; ${s.region}. Env var names: ${s.envVars.join(", ")}. ${s.notes}`,
    });
  }
  for (const c of commits || []) {
    out.push({ kind: "Commit", label: `${c.sha} · ${fullDate(c.at)}`, href: c.url, at: new Date(c.at).getTime(), ctx: "GitHub commits", text: `Commit ${c.sha} by ${c.author} on ${fullDate(c.at)}: ${c.msg}` });
  }
  return out;
}

function rank(records: Record_[], question: string, limit = 16) {
  const q = terms(question);
  const now = Date.now();
  const wantsRecent = /stop|left off|last|yesterday|recent|next|resume/i.test(question);
  return records
    .map((r) => {
      const text = r.text.toLowerCase();
      let score = q.reduce((s, t) => s + (text.includes(t) ? 2 : 0), 0);
      const ageDays = (now - r.at) / 86400000;
      score += Math.max(0, 3 - ageDays / 3) * (wantsRecent ? 1.5 : 0.5);
      if (r.kind === "Project") score += 2;
      if (wantsRecent && r.kind === "Session") score += 2;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}

/* -------------------------------------------------------------- Assistant */

const AnswerSchema = z.object({
  facts: z.string().describe("Answer built ONLY from the numbered records. Cite each fact with [n]. Use **bold** for key items and `code` for identifiers. 1-3 short paragraphs separated by blank lines."),
  citations: z.array(z.number().int()).describe("Record numbers actually cited in facts"),
  // Gemini's response schema rejects nullable types, so "none" is an empty string.
  suggestion: z.string().describe("Optional recommendation or next step that goes beyond the records. Empty string if not useful."),
  suggestedTaskTitle: z.string().describe("Title of a concrete task the user could add, if the suggestion implies one; otherwise empty string."),
  suggestedTaskPriority: z.enum(["Urgent", "High", "Normal", "Low"]).describe("Priority for the suggested task (use Normal if there is none)."),
});
type Answer = z.infer<typeof AnswerSchema>;

const askPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are DevVault's project assistant for a developer. You answer questions about ONE project using numbered records (work sessions, tasks, docs, services, commits).
Rules:
- In "facts", state only what the records support and cite them like [2]. If the records don't contain the answer, say so plainly.
- Keep "facts" separate from your own ideas. Put recommendations in "suggestion" (it is shown as "not yet verified").
- Never ask for or output secrets, passwords, API keys or connection strings.
- Be concise and specific. Today's date is {today}.`,
  ],
  ["human", "Project records:\n{records}\n\nEarlier in this conversation:\n{history}\n\nQuestion: {question}"],
]);

export async function askProject(p: IProject, question: string, history: { role: string; content: string }[]) {
  const records = rank(await projectRecords(p), question);
  const numbered = records.map((r, i) => `[${i + 1}] (${r.kind}) ${r.text}`).join("\n");
  const chain = askPrompt.pipe(structured(AnswerSchema, "project_answer"));
  const res = (await chain.invoke({
    today: fullDate(new Date()),
    records: numbered || "(no records yet)",
    history: history.slice(-6).map((m) => `${m.role}: ${m.content.slice(0, 600)}`).join("\n") || "(none)",
    question,
  })) as Answer;

  const cited = [...new Set(res.citations)].filter((n) => n >= 1 && n <= records.length).sort((a, b) => a - b);
  // Renumber citations 1..k in order of appearance so the UI shows compact sources.
  const map = new Map(cited.map((n, i) => [n, i + 1]));
  const facts = res.facts.replace(/\[(\d+)\]/g, (m, n) => (map.has(Number(n)) ? `[${map.get(Number(n))}]` : ""));
  const sources: ISource[] = cited.map((n) => {
    const r = records[n - 1];
    return { n: map.get(n)!, kind: r.kind, label: r.label, href: r.href };
  });
  const counts = new Map<string, number>();
  records.forEach((r) => counts.set(r.ctx, (counts.get(r.ctx) || 0) + 1));
  const context = [...counts.entries()].map(([label, c]) => ({ label, count: String(c) }));
  const suggestion = res.suggestion?.trim() || null;
  const suggestedTask = suggestion && res.suggestedTaskTitle?.trim() ? { title: res.suggestedTaskTitle.trim().slice(0, 300), priority: res.suggestedTaskPriority } : null;
  return { facts, suggestion, suggestedTask, sources, context };
}

/* ------------------------------------------------------------ Resume work */

const ResumeSchema = z.object({
  nextStep: z.string().describe("One or two sentences: the single best next step, specific and actionable."),
  basedOn: z.array(z.string()).describe("Short labels of the records used, e.g. 'Session #42', 'Task SF-118'"),
});

export async function resumeSuggestion(p: IProject, lastSession: IWorkSession | null, openTasks: ITask[]) {
  const material = [
    lastSession ? `Last session #${lastSession.number}: ${lastSession.summary}. Blockers: ${lastSession.blockers || "none"}. Planned next: ${lastSession.nextStep || "none"}. Files: ${lastSession.files.join(", ")}` : "No sessions logged yet.",
    ...openTasks.slice(0, 12).map((t) => `Task ${t.key} "${t.title}" status ${t.status} priority ${t.priority}${t.dueDate ? " due " + fullDate(t.dueDate) : ""}`),
  ].join("\n");
  const hash = sha256(material);
  if (p.resume && p.resume.sourceHash === hash) return { text: p.resume.text, basedOn: p.resume.basedOn, hash, cached: true };
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You help a developer resume work on a project. Recommend the single best next step from their records. Never mention secrets."],
    ["human", "Project: {name} ({stack})\nRecords:\n{material}"],
  ]);
  const res = (await prompt.pipe(structured(ResumeSchema, "resume_next_step")).invoke({ name: p.name, stack: p.stack.join(", "), material })) as z.infer<typeof ResumeSchema>;
  return { text: res.nextStep, basedOn: res.basedOn.slice(0, 4), hash, cached: false };
}
