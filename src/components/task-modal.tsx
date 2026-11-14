"use client";

import { useState } from "react";
import { api, ErrorNote, Field, Modal, Spinner } from "./ui";
import { TASK_COLUMNS } from "@/lib/catalog";

export type TaskDraft = { id?: string; title: string; description: string; status: string; priority: string; tag: string; dueDate: string | null; hasDoc: boolean; aiSuggested?: boolean };

const empty = (status = "todo"): TaskDraft => ({ title: "", description: "", status, priority: "Normal", tag: "", dueDate: null, hasDoc: false });

export function TaskModal({ open, onClose, projectId, task, defaultStatus, onSaved }: { open: boolean; onClose: () => void; projectId: string; task?: TaskDraft | null; defaultStatus?: string; onSaved: () => void }) {
  const [f, setF] = useState<TaskDraft>(task ?? empty(defaultStatus));
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");
  // State is initialised from props; the parent remounts this component (via `key`) for each task.

  async function save() {
    setBusy("save");
    setError("");
    try {
      const json = { title: f.title, description: f.description, status: f.status, priority: f.priority, tag: f.tag, dueDate: f.dueDate || null, hasDoc: f.hasDoc };
      if (f.id) await api(`/api/projects/${projectId}/tasks/${f.id}`, { method: "PATCH", json });
      else await api(`/api/projects/${projectId}/tasks`, { method: "POST", json });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  async function remove() {
    if (!f.id || !confirm("Delete this task?")) return;
    setBusy("delete");
    try {
      await api(`/api/projects/${projectId}/tasks/${f.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={f.id ? "Edit task" : "New task"}
      footer={
        <>
          {f.id && (
            <button type="button" onClick={remove} disabled={!!busy} className="btn-ghost mr-auto text-danger">
              {busy === "delete" && <Spinner />}Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 font-semibold text-ink">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!!busy || !f.title.trim()} className="btn-primary h-10 px-[18px]">
            {busy === "save" && <Spinner />}
            {f.id ? "Save task" : "Add task"}
          </button>
        </>
      }
    >
      {f.aiSuggested && <div className="rounded-lg bg-warn-50 px-3 py-2 text-xs font-medium text-warn">AI suggested — review it, then move it to a column to accept.</div>}
      <Field label="Title" htmlFor="t-title">
        <input id="t-title" autoFocus className="input" placeholder="Store processed webhook event IDs" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </Field>
      <Field label="Description" htmlFor="t-desc">
        <textarea id="t-desc" rows={3} className="input-area" placeholder="Context, acceptance criteria, links…" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="Status" htmlFor="t-status">
          <select id="t-status" className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {TASK_COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority" htmlFor="t-prio">
          <select id="t-prio" className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
            {["Urgent", "High", "Normal", "Low"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Tag" htmlFor="t-tag">
          <input id="t-tag" className="input" placeholder="Payments" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />
        </Field>
        <Field label="Due date" htmlFor="t-due">
          <input id="t-due" type="date" className="input" value={f.dueDate ? f.dueDate.slice(0, 10) : ""} onChange={(e) => setF({ ...f, dueDate: e.target.value || null })} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        <input type="checkbox" className="accent-brand" checked={f.hasDoc} onChange={(e) => setF({ ...f, hasDoc: e.target.checked })} />
        Has linked documentation
      </label>
      <ErrorNote>{error}</ErrorNote>
    </Modal>
  );
}
