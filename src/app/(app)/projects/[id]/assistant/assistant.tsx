"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { api, Spinner } from "@/components/ui";
import { cn, relativeDay } from "@/lib/format";

type Source = { n: number; kind: string; label: string; href: string };
type Msg = { role: "user" | "assistant"; content: string; suggestion?: string | null; suggestedTask?: { title: string; priority: string } | null; sources?: Source[]; context?: { label: string; count: string }[]; error?: boolean };

const PROMPTS = ["Where did I stop?", "Explain how authentication works", "Which tasks are blocked and why?", "What third-party services does this use?"];
const CTX_COLORS = ["#0A8D7C", "#3B6FD8", "#7A5AF8", "#F6921E", "#94A3B8", "#D6457A"];

/** Renders **bold**, `code` and [n] citations from model output, safely (no HTML injection). */
function Rich({ text, sources, projectId }: { text: string; sources: Source[]; projectId: string }) {
  const paras = text.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <>
      {paras.map((para, i) => (
        <p key={i} className="m-0 leading-[1.65] whitespace-pre-line">
          {para.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g).map((part, j) => {
            if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={j}>{part.slice(2, -2)}</strong>;
            if (/^`[^`]+`$/.test(part))
              return (
                <code key={j} className="rounded bg-[#F3F4F6] px-[5px] py-px font-mono text-[12.5px]">
                  {part.slice(1, -1)}
                </code>
              );
            const m = part.match(/^\[(\d+)\]$/);
            if (m) {
              const s = sources.find((x) => x.n === Number(m[1]));
              if (!s) return null;
              const external = s.href.startsWith("http");
              return (
                <a key={j} href={external ? s.href : s.href || `/projects/${projectId}`} target={external ? "_blank" : undefined} rel="noreferrer" className="align-super text-xs font-semibold" title={`${s.kind} · ${s.label}`}>
                  [{s.n}]
                </a>
              );
            }
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </p>
      ))}
    </>
  );
}

export function Assistant({
  project,
  snapshot,
  conversations,
  initial,
  autoAsk,
}: {
  project: { id: string; name: string; color: string; milestone: string | null };
  snapshot: { pct: number; open: number; blocked: number };
  conversations: { id: string; title: string; updatedAt: string }[];
  initial: { id: string; messages: Msg[] } | null;
  autoAsk: string | null;
}) {
  const router = useRouter();
  const [cid, setCid] = useState<string | null>(initial?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>(initial?.messages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const base = `/projects/${project.id}`;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.error);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: question }]);
    try {
      const r = await api<{ conversationId: string; message: Msg }>(`/api/projects/${project.id}/assistant`, { method: "POST", json: { question, conversationId: cid } });
      setMessages((m) => [...m, r.message]);
      if (!cid) {
        setCid(r.conversationId);
        window.history.replaceState(null, "", `${base}/assistant?c=${r.conversationId}`);
        router.refresh();
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: (e as Error).message, error: true }]);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (autoAsk && !asked.current) {
      asked.current = true;
      ask(autoAsk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk]);

  async function addTask(i: number, t: { title: string; priority: string }) {
    await api(`/api/projects/${project.id}/tasks`, { method: "POST", json: { title: t.title, priority: t.priority, aiSuggested: true } });
    setAdded((a) => ({ ...a, [i]: true }));
  }

  async function removeConvo(id: string) {
    if (!confirm("Delete this conversation?")) return;
    await api(`/api/projects/${project.id}/assistant?c=${id}`, { method: "DELETE" });
    if (id === cid) router.push(`${base}/assistant`);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-wrap">
      {/* Conversations */}
      <aside aria-label="Conversations" className="flex w-[240px] flex-none flex-col gap-2 border-r border-line bg-white p-3 max-lg:w-full max-lg:border-r-0 max-lg:border-b">
        <Link href={`${base}/assistant`} className="btn h-9 border border-dashed border-[#CBD2DA] bg-white font-medium text-ink-2 hover:text-ink">
          <Icon name="plus" size={14} strokeWidth={2.2} />
          New conversation
        </Link>
        <span className="px-2.5 pt-2 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">Conversations</span>
        <div className="flex flex-col gap-0.5 overflow-y-auto max-lg:max-h-40">
          {conversations.length === 0 && <span className="px-2.5 text-xs text-muted">None yet</span>}
          {conversations.map((c) => (
            <div key={c.id} className={cn("group flex items-center rounded-lg", c.id === cid ? "bg-brand-50" : "hover:bg-canvas")}>
              <Link href={`${base}/assistant?c=${c.id}`} className={cn("flex min-w-0 flex-1 flex-col gap-px px-2.5 py-[7px] text-[13px]", c.id === cid ? "font-semibold text-brand" : "font-medium text-ink-2")}>
                <span className="truncate">{c.title}</span>
                <span className="text-[11px] font-normal text-muted">{relativeDay(c.updatedAt)}</span>
              </Link>
              <button type="button" onClick={() => removeConvo(c.id)} aria-label={`Delete conversation ${c.title}`} className="mr-1 hidden h-6 w-6 items-center justify-center rounded text-muted group-hover:inline-flex">
                <Icon name="trash" size={12} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <main className="flex min-w-0 flex-[999_1_480px] flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-white px-6 py-2.5 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-1">
            <Icon name="shield" size={13} />
            Secrets and connection strings are never sent to AI
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col gap-6 px-8 py-7 max-sm:px-4">
          {messages.length === 0 && !busy && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand">
                <Icon name="sparkles" size={20} />
              </span>
              <h2 className="m-0 text-lg font-bold">Ask about {project.name}</h2>
              <p className="m-0 max-w-md text-[13px] leading-normal text-muted">Answers come from this project&apos;s sessions, tasks, docs, services and commits — with sources. Ideas beyond your records are labelled as suggestions.</p>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="max-w-[80%] self-end rounded-[14px_14px_4px_14px] bg-brand px-[15px] py-[11px] leading-normal text-white">
                {m.content}
              </div>
            ) : (
              <div key={i} className="flex items-start gap-3">
                <div aria-hidden="true" className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-brand-50 text-brand">
                  <Icon name="sparkle" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                  {m.error ? (
                    <div className="rounded-xl border border-danger-500/30 bg-danger-50 px-4 py-3 text-[13px] text-danger">{m.content}</div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-white px-[18px] py-4">
                        <span className="eyebrow bg-line-soft text-ink-2">From your records</span>
                        <Rich text={m.content} sources={m.sources ?? []} projectId={project.id} />
                      </div>
                      {m.suggestion && (
                        <div className="flex flex-col gap-2.5 rounded-xl border border-warn-line bg-warn-25 px-[18px] py-4">
                          <span className="eyebrow bg-warn-50 text-warn">Suggestion · not yet verified</span>
                          <Rich text={m.suggestion} sources={[]} projectId={project.id} />
                          {m.suggestedTask && (
                            <div className="flex flex-wrap gap-2">
                              <button type="button" disabled={added[i]} onClick={() => addTask(i, m.suggestedTask!)} className="btn-primary h-[30px] rounded-[7px] px-[11px] text-xs">
                                {added[i] ? (
                                  <>
                                    <Icon name="check" size={12} strokeWidth={2.6} />
                                    Added to To do
                                  </>
                                ) : (
                                  "Add as task"
                                )}
                              </button>
                              <span className="self-center text-xs text-muted">&ldquo;{m.suggestedTask.title}&rdquo;</span>
                            </div>
                          )}
                        </div>
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted">Sources</span>
                          <div className="flex flex-wrap gap-2">
                            {m.sources.map((s) => {
                              const external = s.href.startsWith("http");
                              return (
                                <a key={s.n} href={s.href} target={external ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink-2">
                                  <span className="font-bold text-brand">{s.n}</span>
                                  <span className="font-semibold">{s.kind}</span>
                                  <span className="text-muted">{s.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          )}
          {busy && (
            <div className="flex items-center gap-3 text-[13px] text-muted">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brand-50 text-brand">
                <Spinner />
              </div>
              Reading your sessions, tasks and docs…
            </div>
          )}
          {!busy && (
            <div className={cn("flex flex-wrap gap-2", messages.length > 0 && "pl-[42px]")}>
              {PROMPTS.map((p) => (
                <button key={p} type="button" onClick={() => ask(p === "Where did I stop?" ? "Where did I stop working on this project, and what should I do next?" : p)} className="h-8 rounded-full border border-line bg-white px-3 text-[13px] text-ink-2 hover:border-brand-500/50">
                  {p}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="sticky bottom-0 mx-auto w-full max-w-[820px] px-8 pb-6 max-sm:px-4"
        >
          <div className="flex flex-col gap-2.5 rounded-[14px] border border-field bg-white px-3.5 py-3 shadow-[0_4px_16px_rgba(15,23,42,.06)]">
            <label htmlFor="ask" className="sr-only-x">
              Ask about this project
            </label>
            <textarea
              id="ask"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder={`Ask about ${project.name} — architecture, tasks, sessions, commits…`}
              className="resize-none border-0 bg-transparent text-sm text-ink outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-[9px] py-1 text-xs font-medium text-brand">
                <span className="h-2 w-2 rounded-sm" style={{ background: project.color }} />
                Scope: {project.name}
              </span>
              <span className="text-xs text-muted max-sm:hidden">Docs · Sessions · Tasks · GitHub</span>
              <span className="flex-1" />
              <button type="submit" aria-label="Send" disabled={busy || !input.trim()} className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] bg-brand text-white disabled:opacity-50">
                <Icon name="send" />
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Context panel */}
      <aside aria-label="Project context" className="flex w-[300px] flex-none flex-col gap-[22px] border-l border-line bg-white p-5 max-xl:hidden">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-sm font-semibold">Project snapshot</h2>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">{project.milestone || "Progress"}</span>
              <span className="font-semibold">{snapshot.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-line-soft">
              <div className="h-1.5 rounded-full bg-success-500" style={{ width: `${snapshot.pct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-canvas p-2.5">
              <div className="text-lg font-bold">{snapshot.open}</div>
              <div className="text-xs text-muted">Open tasks</div>
            </div>
            <div className="rounded-lg bg-canvas p-2.5">
              <div className="text-lg font-bold">{snapshot.blocked}</div>
              <div className="text-xs text-muted">Blocked</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="m-0 text-sm font-semibold">Context used for last answer</h2>
          {!lastAssistant?.context?.length && <span className="text-xs text-muted">Ask a question to see what was retrieved.</span>}
          {lastAssistant?.context?.map((c, i) => (
            <div key={c.label} className="flex items-center gap-2.5 text-[13px]">
              <span className="h-2 w-2 flex-none rounded-sm" style={{ background: CTX_COLORS[i % CTX_COLORS.length] }} />
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              <span className="text-xs text-muted">{c.count}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 rounded-[10px] bg-canvas p-3">
          <Icon name="padlock" className="mt-px text-brand" />
          <span className="text-xs leading-normal text-ink-2">Retrieval is limited to this project in your workspace. Vault values and database URLs are excluded from every prompt.</span>
        </div>
      </aside>
    </div>
  );
}
