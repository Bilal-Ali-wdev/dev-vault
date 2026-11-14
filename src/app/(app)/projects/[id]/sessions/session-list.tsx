"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/page-header";
import { EndSessionModal, StartSessionButton } from "@/components/session-modals";
import { api, ErrorNote, Field, Modal, Spinner } from "@/components/ui";
import { duration, fullDate, timeOfDay } from "@/lib/format";

export type SessionDTO = { id: string; number: number; startedAt: string; endedAt: string | null; summary: string; files: string[]; blockers: string; nextStep: string };

export function SessionList({ projectId, sessions, otherRunning }: { projectId: string; sessions: SessionDTO[]; otherRunning: boolean }) {
  const router = useRouter();
  const active = sessions.find((s) => !s.endedAt);
  const [ending, setEnding] = useState(false);
  const [edit, setEdit] = useState<SessionDTO | null>(null);
  const [f, setF] = useState({ summary: "", files: "", blockers: "", nextStep: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = sessions.filter((s) => s.endedAt).reduce((m, s) => m + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()), 0);

  function openEdit(s: SessionDTO) {
    setEdit(s);
    setF({ summary: s.summary, files: s.files.join(", "), blockers: s.blockers, nextStep: s.nextStep });
    setError("");
  }

  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await api(`/api/projects/${projectId}/sessions/${edit.id}`, { method: "PATCH", json: { ...f, files: f.files.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) } });
      setEdit(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function remove() {
    if (!edit || !confirm("Delete this session?")) return;
    await api(`/api/projects/${projectId}/sessions/${edit.id}`, { method: "DELETE" });
    setEdit(null);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-col gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-lg font-bold">Work sessions</h2>
          <span className="text-[13px] text-muted">
            {sessions.length} logged · {duration(total)} total. Sessions feed Resume My Work and the AI assistant.
          </span>
        </div>
        {active ? (
          <button type="button" onClick={() => setEnding(true)} className="btn-primary">
            <Icon name="stop" size={13} />
            End session #{active.number}
          </button>
        ) : (
          <StartSessionButton projectId={projectId} disabled={otherRunning} className="btn-primary" />
        )}
      </div>
      {otherRunning && <p className="m-0 text-[13px] text-warn">A session is running in another project. End it from the sidebar first.</p>}

      {sessions.length === 0 ? (
        <EmptyState icon="clock" title="No sessions yet">
          Start a session when you sit down to work. When you end it, note what you did, files touched, blockers and the next step.
        </EmptyState>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {sessions.map((s) => (
            <li key={s.id} className="card flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-semibold text-muted">#{s.number}</span>
                <span className="font-semibold">{fullDate(s.startedAt)}</span>
                <span className="text-[13px] text-muted">
                  {timeOfDay(s.startedAt)} – {s.endedAt ? timeOfDay(s.endedAt) : "now"}
                </span>
                {s.endedAt ? (
                  <span className="pill bg-chip text-ink-2">{duration(new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime())}</span>
                ) : (
                  <span className="pill bg-brand-50 text-brand">Running</span>
                )}
                <span className="flex-1" />
                {s.endedAt && (
                  <button type="button" onClick={() => openEdit(s)} aria-label={`Edit session ${s.number}`} className="icon-btn">
                    <Icon name="edit" size={14} />
                  </button>
                )}
              </div>
              {s.summary && <p className="m-0 leading-normal">{s.summary}</p>}
              {s.files.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.files.map((f) => (
                    <code key={f} className="code-chip">
                      {f}
                    </code>
                  ))}
                </div>
              )}
              {(s.blockers || s.nextStep) && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
                  {s.blockers && (
                    <div className="rounded-lg bg-danger-50 px-3 py-2 text-[13px]">
                      <span className="block text-xs font-semibold text-danger">Blocker</span>
                      {s.blockers}
                    </div>
                  )}
                  {s.nextStep && (
                    <div className="rounded-lg bg-brand-25 px-3 py-2 text-[13px]">
                      <span className="block text-xs font-semibold text-brand">Next step</span>
                      {s.nextStep}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {active && <EndSessionModal open={ending} onClose={() => setEnding(false)} projectId={projectId} sessionId={active.id} />}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Edit session #${edit?.number ?? ""}`}
        footer={
          <>
            <button type="button" onClick={remove} className="btn-ghost mr-auto text-danger">
              Delete
            </button>
            <button type="button" onClick={save} disabled={busy} className="btn-primary h-10 px-[18px]">
              {busy && <Spinner />}Save
            </button>
          </>
        }
      >
        <Field label="Summary" htmlFor="e-sum">
          <textarea id="e-sum" rows={3} className="input-area" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
        </Field>
        <Field label="Files touched" htmlFor="e-files">
          <input id="e-files" className="input font-mono text-[13px]" value={f.files} onChange={(e) => setF({ ...f, files: e.target.value })} />
        </Field>
        <Field label="Blockers" htmlFor="e-block">
          <input id="e-block" className="input" value={f.blockers} onChange={(e) => setF({ ...f, blockers: e.target.value })} />
        </Field>
        <Field label="Next step" htmlFor="e-next">
          <input id="e-next" className="input" value={f.nextStep} onChange={(e) => setF({ ...f, nextStep: e.target.value })} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </Modal>
    </main>
  );
}
