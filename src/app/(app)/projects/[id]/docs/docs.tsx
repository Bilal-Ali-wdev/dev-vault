"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { api, ErrorNote, Spinner } from "@/components/ui";
import { cn, relativeDay } from "@/lib/format";

type DocDTO = { id: string; title: string; kind: "doc" | "architecture"; content: string; updatedAt: string };

export function Docs({ projectId, docs }: { projectId: string; docs: DocDTO[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(docs[0]?.id ?? null);
  const current = docs.find((d) => d.id === sel);
  const [draft, setDraft] = useState<Omit<DocDTO, "updatedAt" | "id"> & { id?: string }>(current ?? { title: "", kind: "doc", content: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function pick(d: DocDTO | null) {
    setSel(d?.id ?? null);
    setDraft(d ?? { title: "", kind: "doc", content: "" });
    setError("");
    setSavedAt(null);
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const json = { title: draft.title, kind: draft.kind, content: draft.content };
      if (draft.id) await api(`/api/projects/${projectId}/docs/${draft.id}`, { method: "PATCH", json });
      else {
        const r = await api<{ doc: { _id: string } }>(`/api/projects/${projectId}/docs`, { method: "POST", json });
        setSel(r.doc._id);
        setDraft({ ...draft, id: r.doc._id });
      }
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function remove() {
    if (!draft.id || !confirm(`Delete “${draft.title}”?`)) return;
    await api(`/api/projects/${projectId}/docs/${draft.id}`, { method: "DELETE" });
    pick(null);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-wrap items-start gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
      <aside className="card flex w-[260px] flex-none flex-col gap-1 p-2.5 max-md:w-full">
        <button type="button" onClick={() => pick(null)} className="btn h-9 border border-dashed border-[#CBD2DA] bg-white font-medium text-ink-2">
          <Icon name="plus" size={14} />
          New doc
        </button>
        {docs.length === 0 && <p className="m-0 px-2 py-3 text-xs leading-normal text-muted">Docs and architecture notes give the AI assistant real context about this project.</p>}
        {docs.map((d) => (
          <button key={d.id} type="button" onClick={() => pick(d)} className={cn("flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left", sel === d.id ? "bg-brand-50" : "hover:bg-canvas")}>
            <span className={cn("flex w-full items-center gap-1.5 truncate text-[13px]", sel === d.id ? "font-semibold text-brand" : "font-medium text-ink-2")}>
              <Icon name={d.kind === "architecture" ? "layers" : "doc"} size={13} />
              <span className="truncate">{d.title}</span>
            </span>
            <span className="text-[11px] text-muted">Updated {relativeDay(d.updatedAt).toLowerCase()}</span>
          </button>
        ))}
      </aside>
      <section className="card flex min-w-0 flex-[1_1_480px] flex-col gap-3.5 p-5">
        <div className="flex flex-wrap gap-3">
          <label className="sr-only-x" htmlFor="doc-title">
            Title
          </label>
          <input id="doc-title" className="input min-w-[200px] flex-1 text-base font-semibold" placeholder="Auth flow.md" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <label className="sr-only-x" htmlFor="doc-kind">
            Kind
          </label>
          <select id="doc-kind" className="input w-auto" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as DocDTO["kind"] })}>
            <option value="doc">Doc</option>
            <option value="architecture">Architecture record</option>
          </select>
        </div>
        <label className="sr-only-x" htmlFor="doc-body">
          Content
        </label>
        <textarea
          id="doc-body"
          rows={20}
          className="input-area min-h-[420px] font-mono text-[13px]"
          placeholder={"# Auth flow\n\nAccess tokens are signed with JWT_SECRET and expire after 15 minutes…\n\nWrite in Markdown. Don't paste secret values — keep those in the Vault."}
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap items-center gap-2.5">
          {draft.id && (
            <button type="button" onClick={remove} className="btn-ghost text-danger">
              Delete
            </button>
          )}
          <span className="flex-1 text-xs text-muted">{savedAt ? `Saved at ${savedAt}` : "Docs are included as context for the AI assistant."}</span>
          <button type="button" onClick={save} disabled={busy || !draft.title.trim()} className="btn-primary h-10 px-[18px]">
            {busy && <Spinner />}
            {draft.id ? "Save changes" : "Create doc"}
          </button>
        </div>
      </section>
    </main>
  );
}
