"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useReauth } from "@/components/reauth";
import { api, ErrorNote, Field, Modal, Spinner } from "@/components/ui";
import { ENV_META } from "@/lib/catalog";
import { cn, relativeDay, timeOfDay } from "@/lib/format";
import type { SecretRow } from "@/lib/vault";

type Audit = { id: string; action: string; target: string; meta: string; at: string };
const AUDIT_DOT: Record<string, string> = { Revealed: "#F6921E", Updated: "#0A8D7C", Created: "#39AA70", Copied: "#3B6FD8", Exported: "#7A5AF8", Deleted: "#D93F3F" };
const ROT: Record<string, string> = { ok: "bg-success-50 text-success", due: "bg-warn-50 text-warn", none: "bg-chip text-ink-3" };

type Draft = { id?: string; key: string; value: string; description: string; service: string; environment: string; rotationDays: string };

function without(r: Record<string, string>, id: string) {
  const next = { ...r };
  delete next[id];
  return next;
}

export function Vault({ projectId, projectName, secrets, audit, overdue, services, mfaAgoMin }: { projectId: string; projectName: string; secrets: SecretRow[]; audit: Audit[]; overdue: { id: string; key: string; environment: string; age: number; policy: number }[]; services: string[]; mfaAgoMin: number | null }) {
  const router = useRouter();
  const { run, dialog } = useReauth();
  const [env, setEnv] = useState("development");
  const [q, setQ] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<SecretRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const counts = useMemo(() => Object.fromEntries(ENV_META.map((e) => [e.id, secrets.filter((s) => s.environment === e.id).length])), [secrets]);
  const rows = secrets.filter((s) => s.environment === env && (!q || s.key.toLowerCase().includes(q.toLowerCase())));
  const envName = ENV_META.find((e) => e.id === env)!.name;

  async function getValue(s: SecretRow, purpose: "reveal" | "copy") {
    const r = await run(() => api<{ value: string }>(`/api/projects/${projectId}/secrets/${s.id}/reveal`, { method: "POST", json: { purpose } }));
    return r.value;
  }

  async function toggleReveal(s: SecretRow) {
    if (revealed[s.id] !== undefined) {
      setRevealed((r) => without(r, s.id));
      return;
    }
    setError("");
    setBusy(s.id + ":reveal");
    try {
      const v = await getValue(s, "reveal");
      setRevealed((r) => ({ ...r, [s.id]: v }));
      // Auto-hide after 30 seconds.
      setTimeout(() => setRevealed((r) => without(r, s.id)), 30_000);
      router.refresh();
    } catch (e) {
      if ((e as Error).message !== "cancelled") setError((e as Error).message);
    }
    setBusy(null);
  }

  async function copy(s: SecretRow) {
    setError("");
    setBusy(s.id + ":copy");
    try {
      const v = await getValue(s, "copy");
      await navigator.clipboard.writeText(v);
      setCopied(s.id);
      setTimeout(() => setCopied(null), 1800);
      router.refresh();
    } catch (e) {
      if ((e as Error).message !== "cancelled") setError((e as Error).message);
    }
    setBusy(null);
  }

  async function exportEnv() {
    setError("");
    setBusy("export");
    try {
      const r = await run(() => api<{ filename: string; content: string }>(`/api/projects/${projectId}/secrets/export`, { method: "POST", json: { environment: env } }));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([r.content], { type: "text/plain" }));
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(a.href);
      router.refresh();
    } catch (e) {
      if ((e as Error).message !== "cancelled") setError((e as Error).message);
    }
    setBusy(null);
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy("save");
    setFormError("");
    const rotationDays = draft.rotationDays ? Number(draft.rotationDays) : null;
    try {
      if (draft.id) {
        await api(`/api/projects/${projectId}/secrets/${draft.id}`, { method: "PATCH", json: { description: draft.description, service: draft.service, rotationDays, ...(draft.value ? { value: draft.value } : {}) } });
        setRevealed((r) => without(r, draft.id!));
      } else {
        await api(`/api/projects/${projectId}/secrets`, { method: "POST", json: { key: draft.key, value: draft.value, description: draft.description, service: draft.service, environment: draft.environment, rotationDays } });
      }
      setDraft(null);
      router.refresh();
    } catch (e) {
      setFormError((e as Error).message);
    }
    setBusy(null);
  }

  async function remove() {
    if (!draft?.id || !confirm(`Delete ${draft.key} from ${draft.environment}? This can't be undone.`)) return;
    setBusy("delete");
    try {
      await api(`/api/projects/${projectId}/secrets/${draft.id}`, { method: "DELETE" });
      setDraft(null);
      router.refresh();
    } catch (e) {
      setFormError((e as Error).message);
    }
    setBusy(null);
  }

  const newDraft = (): Draft => ({ key: "", value: "", description: "", service: "", environment: env, rotationDays: "" });
  const editDraft = (s: SecretRow): Draft => ({ id: s.id, key: s.key, value: "", description: s.description, service: s.service, environment: s.environment, rotationDays: s.rotationDays ? String(s.rotationDays) : "" });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3 max-sm:px-4">
        <h2 className="m-0 flex-1 text-base font-bold">Environment vault</h2>
        <button type="button" onClick={exportEnv} disabled={busy === "export" || !counts[env]} className="btn-secondary h-[34px]">
          {busy === "export" ? <Spinner /> : <Icon name="download" size={14} />}
          Export .env
        </button>
        <button type="button" onClick={() => setDraft(newDraft())} className="btn-primary h-[34px]">
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Add secret
        </button>
      </div>

      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
        <div className="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-white px-[18px] py-3.5">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] bg-brand-50 text-brand">
            <Icon name="shieldCheck" size={18} />
          </div>
          <div className="flex min-w-[240px] flex-1 flex-col gap-0.5">
            <span className="font-semibold">Encrypted with AES-256-GCM</span>
            <span className="text-[13px] text-muted">Values are encrypted before they reach the database. Reveals, copies and exports require a fresh MFA check and are audit-logged.</span>
          </div>
          {mfaAgoMin !== null ? (
            <span className="rounded-md bg-success-50 px-[9px] py-1 text-xs font-semibold text-success">MFA verified {mfaAgoMin === 0 ? "just now" : `${mfaAgoMin} min ago`}</span>
          ) : (
            <span className="rounded-md bg-chip px-[9px] py-1 text-xs font-semibold text-ink-3">MFA check needed to reveal</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap gap-0.5 rounded-[9px] bg-[#EBEEF1] p-[3px]">
            {ENV_META.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={env === e.id}
                onClick={() => setEnv(e.id)}
                className={cn("inline-flex h-[30px] items-center gap-[7px] rounded-[7px] px-3 text-[13px]", env === e.id ? "bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(15,23,42,.1)]" : "font-medium text-ink-3")}
              >
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: e.dot }} />
                {e.name}
                <span className="text-xs font-medium text-muted">{counts[e.id]}</span>
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <label className="flex h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-muted">
            <Icon name="search" size={14} />
            <span className="sr-only-x">Search variables</span>
            <input placeholder="Search variable names" value={q} onChange={(e) => setQ(e.target.value)} className="w-[170px] border-0 bg-transparent text-[13px] text-ink outline-none" />
          </label>
        </div>
        <ErrorNote>{error}</ErrorNote>

        <div className="flex flex-wrap items-start gap-[18px]">
          <section aria-label="Secrets" className="card min-w-0 flex-[999_1_560px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#FBFBFC] text-left text-xs text-muted">
                    <th className="border-b border-line-soft px-[18px] py-2.5 font-medium">Variable</th>
                    <th className="border-b border-line-soft px-3 py-2.5 font-medium">Value</th>
                    <th className="border-b border-line-soft px-3 py-2.5 font-medium">Service</th>
                    <th className="border-b border-line-soft px-3 py-2.5 font-medium">Updated</th>
                    <th className="border-b border-line-soft px-3 py-2.5 font-medium">Rotation</th>
                    <th className="border-b border-line-soft py-2.5 pr-[18px] pl-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td className="border-b border-line-row px-[18px] py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[13px] font-medium">{s.key}</span>
                          {s.description && <span className="text-xs text-muted">{s.description}</span>}
                        </div>
                      </td>
                      <td className="max-w-[260px] border-b border-line-row p-3">
                        {!s.hasValue ? (
                          <span className="rounded-[5px] border border-dashed border-[#CBD2DA] px-2 py-[3px] text-xs text-muted">Not set</span>
                        ) : revealed[s.id] !== undefined ? (
                          <code className="block truncate rounded-[5px] bg-warn-50 px-2 py-[3px] font-mono text-xs text-ink" title="Hides automatically after 30 seconds">
                            {revealed[s.id] || "(empty)"}
                          </code>
                        ) : (
                          <span className="rounded-[5px] bg-[#F3F4F6] px-2 py-[3px] font-mono tracking-[0.12em] text-muted">••••••••••••</span>
                        )}
                      </td>
                      <td className="border-b border-line-row p-3">{s.service ? <span className="rounded-[5px] bg-chip px-2 py-0.5 text-xs font-medium text-ink-2">{s.service}</span> : <span className="text-muted">—</span>}</td>
                      <td className="border-b border-line-row p-3 whitespace-nowrap text-muted">{s.updated}</td>
                      <td className="border-b border-line-row p-3">
                        <span className={`pill ${ROT[s.rotation.tone]}`}>{s.rotation.label}</span>
                      </td>
                      <td className="border-b border-line-row py-3 pr-[18px] pl-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" disabled={!s.hasValue || !!busy} onClick={() => toggleReveal(s)} aria-label={revealed[s.id] !== undefined ? `Hide ${s.key}` : `Reveal ${s.key}`} className="icon-btn">
                            {busy === s.id + ":reveal" ? <Spinner size={12} /> : <Icon name={revealed[s.id] !== undefined ? "eyeOff" : "eye"} size={14} />}
                          </button>
                          <button type="button" disabled={!s.hasValue || !!busy} onClick={() => copy(s)} aria-label={`Copy ${s.key}`} className="icon-btn">
                            {busy === s.id + ":copy" ? <Spinner size={12} /> : <Icon name={copied === s.id ? "check" : "copy"} size={14} />}
                          </button>
                          <button type="button" onClick={() => setHistory(s)} aria-label={`Version history for ${s.key}`} className="icon-btn">
                            <Icon name="clock" size={14} />
                          </button>
                          <button type="button" onClick={() => setDraft(editDraft(s))} aria-label={`Edit ${s.key}`} className="icon-btn">
                            <Icon name="edit" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-[18px] py-10 text-center text-muted">
                        {q ? "No variables match." : `No ${envName.toLowerCase()} secrets yet.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-between gap-2 px-[18px] py-2.5 text-xs text-muted">
              <span>
                {projectName} · {envName} · {counts[env]} variables
              </span>
              <span>Values are never indexed for search or sent to AI.</span>
            </div>
          </section>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
            {overdue.length > 0 && (
              <section className="flex flex-col gap-2.5 rounded-[14px] border border-warn-line bg-warn-25 px-[18px] py-4">
                <div className="flex items-center gap-2">
                  <Icon name="clock" className="text-warn" />
                  <h2 className="m-0 text-sm font-semibold">Rotation due</h2>
                </div>
                {overdue.slice(0, 3).map((o) => (
                  <p key={o.id} className="m-0 text-[13px] leading-normal text-ink-2">
                    <span className="font-mono font-medium">{o.key}</span> ({o.environment}) hasn&apos;t been rotated in {o.age} days. Your policy is {o.policy}.
                  </p>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const s = secrets.find((x) => x.id === overdue[0].id);
                    if (s) {
                      setEnv(s.environment);
                      setDraft(editDraft(s));
                    }
                  }}
                  className="btn-primary h-[30px] self-start rounded-[7px] px-[11px] text-xs"
                >
                  Rotate now
                </button>
              </section>
            )}
            <section className="card flex flex-col gap-3 px-[18px] py-4">
              <h2 className="m-0 text-sm font-semibold">Audit log</h2>
              {audit.length === 0 && <span className="text-[13px] text-muted">No activity yet.</span>}
              {audit.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 text-[13px]">
                  <span className="mt-1.5 h-2 w-2 flex-none rounded-full" style={{ background: AUDIT_DOT[a.action] ?? "#94A3B8" }} />
                  <div className="flex min-w-0 flex-col gap-px">
                    <span>
                      <strong className="font-semibold">{a.action}</strong> <span className="font-mono text-xs break-all">{a.target}</span>
                    </span>
                    <span className="text-xs text-muted">
                      You{a.meta ? ` · ${a.meta}` : ""} · {relativeDay(a.at) === "Today" ? timeOfDay(a.at) : relativeDay(a.at)}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? `Edit ${draft.key}` : "Add secret"}
        footer={
          <>
            {draft?.id && (
              <button type="button" onClick={remove} disabled={!!busy} className="btn-ghost mr-auto text-danger">
                Delete
              </button>
            )}
            <button type="button" onClick={() => setDraft(null)} className="btn-secondary h-10 px-4 font-semibold text-ink">
              Cancel
            </button>
            <button type="button" onClick={saveDraft} disabled={busy === "save" || !draft?.key} className="btn-primary h-10 px-[18px]">
              {busy === "save" && <Spinner />}
              {draft?.id ? "Save" : "Add secret"}
            </button>
          </>
        }
      >
        {draft && (
          <>
            {!draft.id && (
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <Field label="Variable name" htmlFor="v-key">
                  <input id="v-key" autoFocus className="input font-mono text-[13px] uppercase" placeholder="DATABASE_URL" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                </Field>
                <Field label="Environment" htmlFor="v-env">
                  <select id="v-env" className="input" value={draft.environment} onChange={(e) => setDraft({ ...draft, environment: e.target.value })}>
                    {ENV_META.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <Field label={draft.id ? "New value" : "Value"} htmlFor="v-val" hint={draft.id ? "Leave empty to keep the current value. Saving a value creates a new version." : "Encrypted before it's stored."}>
              <textarea id="v-val" rows={3} spellCheck={false} autoComplete="off" className="input-area font-mono text-[13px]" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="v-desc">
              <input id="v-desc" className="input" placeholder="Primary Postgres (pooled)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <Field label="Service" htmlFor="v-svc">
                <input id="v-svc" list="v-svcs" className="input" placeholder="Stripe" value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })} />
                <datalist id="v-svcs">
                  {services.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Rotate every (days)" htmlFor="v-rot" hint="Blank = manual">
                <input id="v-rot" type="number" min={1} className="input" placeholder="90" value={draft.rotationDays} onChange={(e) => setDraft({ ...draft, rotationDays: e.target.value })} />
              </Field>
            </div>
            <ErrorNote>{formError}</ErrorNote>
          </>
        )}
      </Modal>

      <Modal open={!!history} onClose={() => setHistory(null)} title={`${history?.key ?? ""} · history`} width={440}>
        {history && (history.history.length === 0 ? (
          <p className="m-0 text-muted">No value stored yet.</p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {history.history.map((h, i) => (
              <li key={h.version} className="flex items-center gap-3 rounded-lg border border-line-soft px-3 py-2">
                <span className="font-mono text-xs font-semibold">v{h.version}</span>
                <span className="flex-1 text-[13px] text-muted">{h.at}</span>
                {i === 0 && <span className="pill bg-success-50 text-success">Current</span>}
              </li>
            ))}
          </ol>
        ))}
        <p className="m-0 text-xs text-muted">Previous values stay encrypted and are never displayed.</p>
      </Modal>
      {dialog}
    </>
  );
}
