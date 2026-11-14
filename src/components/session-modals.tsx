"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icons";
import { api, ErrorNote, Field, Modal, Spinner } from "./ui";

export function EndSessionModal({ open, onClose, projectId, sessionId }: { open: boolean; onClose: () => void; projectId: string; sessionId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ summary: "", files: "", blockers: "", nextStep: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api(`/api/projects/${projectId}/sessions/${sessionId}`, {
        method: "PATCH",
        json: { end: true, summary: f.summary, blockers: f.blockers, nextStep: f.nextStep, files: f.files.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) },
      });
      onClose();
      setF({ summary: "", files: "", blockers: "", nextStep: "" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="End and log session"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 font-semibold text-ink">
            Keep working
          </button>
          <button type="button" onClick={save} disabled={busy} className="btn-primary h-10 px-[18px]">
            {busy && <Spinner />}End session
          </button>
        </>
      }
    >
      <p className="m-0 text-[13px] leading-normal text-muted">A few notes now means Resume My Work and the AI can tell you exactly where you stopped next time.</p>
      <Field label="What did you work on?" htmlFor="s-sum">
        <textarea id="s-sum" rows={3} className="input-area" placeholder="Idempotency keys for POST /orders, refund bug triage" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
      </Field>
      <Field label="Files touched" htmlFor="s-files" hint="Comma or line separated">
        <input id="s-files" className="input font-mono text-[13px]" placeholder="orders/service.ts, middleware/idempotency.ts" value={f.files} onChange={(e) => setF({ ...f, files: e.target.value })} />
      </Field>
      <Field label="Blockers" htmlFor="s-block">
        <input id="s-block" className="input" placeholder="Stripe webhook retries create duplicate refunds in staging" value={f.blockers} onChange={(e) => setF({ ...f, blockers: e.target.value })} />
      </Field>
      <Field label="Next step" htmlFor="s-next">
        <input id="s-next" className="input" placeholder="Store processed webhook event IDs" value={f.nextStep} onChange={(e) => setF({ ...f, nextStep: e.target.value })} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
    </Modal>
  );
}

export function StartSessionButton({ projects, projectId, disabled, className = "btn-secondary h-[34px] px-3 font-medium" }: { projects?: { id: string; name: string }[]; projectId?: string; disabled?: boolean; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(projectId ?? projects?.[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/projects/${id}/sessions`, { method: "POST" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setOpen(true);
    }
    setBusy(false);
  }

  return (
    <>
      <button type="button" disabled={disabled || busy} className={className} onClick={() => (projectId ? start(projectId) : setOpen(true))} title={disabled ? "A session is already running" : undefined}>
        {busy ? <Spinner /> : <Icon name="clock" size={14} />}
        Start session
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Start a work session"
        width={440}
        footer={
          !projectId && (
            <button type="button" disabled={!pick || busy} onClick={() => start(pick)} className="btn-primary h-10 px-[18px]">
              {busy && <Spinner />}Start
            </button>
          )
        }
      >
        {!projectId &&
          (projects?.length ? (
            <Field label="Project" htmlFor="ss-p">
              <select id="ss-p" className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <p className="m-0 text-muted">Create a project first.</p>
          ))}
        <ErrorNote>{error}</ErrorNote>
      </Modal>
    </>
  );
}
