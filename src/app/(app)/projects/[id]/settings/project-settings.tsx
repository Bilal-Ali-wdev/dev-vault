"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ErrorNote, Field, Spinner } from "@/components/ui";
import { PROJECT_TYPES } from "@/lib/catalog";

type P = { id: string; name: string; description: string; type: string; status: string; repoUrl: string; liveUrl: string; stack: string; milestoneName: string; milestoneDue: string };

export function ProjectSettings({ project }: { project: P }) {
  const router = useRouter();
  const [f, setF] = useState(project);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [confirmName, setConfirmName] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await api(`/api/projects/${f.id}`, {
        method: "PATCH",
        json: {
          name: f.name,
          description: f.description,
          type: f.type,
          status: f.status,
          repoUrl: f.repoUrl.trim(),
          liveUrl: f.liveUrl.trim(),
          stack: f.stack.split(",").map((s) => s.trim()).filter(Boolean),
          milestone: f.milestoneName.trim() ? { name: f.milestoneName.trim(), dueDate: f.milestoneDue || null } : null,
        },
      });
      setMsg("Saved.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  async function destroy() {
    await api(`/api/projects/${f.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-[820px] flex-col gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
      <form onSubmit={save} className="card flex flex-col gap-4 p-6">
        <h2 className="m-0 text-lg font-bold">Project details</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <Field label="Project name" htmlFor="ps-name">
            <input id="ps-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Project type" htmlFor="ps-type">
            <select id="ps-type" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {PROJECT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" htmlFor="ps-desc" className="col-span-full">
            <textarea id="ps-desc" rows={3} className="input-area" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          <Field label="Status" htmlFor="ps-status">
            <select id="ps-status" className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {["Planning", "Active", "On Hold", "Paused", "Completed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Tech stack" htmlFor="ps-stack" hint="Comma separated">
            <input id="ps-stack" className="input" value={f.stack} onChange={(e) => setF({ ...f, stack: e.target.value })} />
          </Field>
          <Field label="Repository URL" htmlFor="ps-repo">
            <input id="ps-repo" className="input" placeholder="https://github.com/acme/storefront-api" value={f.repoUrl} onChange={(e) => setF({ ...f, repoUrl: e.target.value })} />
          </Field>
          <Field label="Live URL" htmlFor="ps-live">
            <input id="ps-live" className="input" placeholder="https://shop.acme.io" value={f.liveUrl} onChange={(e) => setF({ ...f, liveUrl: e.target.value })} />
          </Field>
          <Field label="Current milestone" htmlFor="ps-ms">
            <input id="ps-ms" className="input" placeholder="v1.0 Launch" value={f.milestoneName} onChange={(e) => setF({ ...f, milestoneName: e.target.value })} />
          </Field>
          <Field label="Milestone due" htmlFor="ps-msd">
            <input id="ps-msd" type="date" className="input" value={f.milestoneDue} onChange={(e) => setF({ ...f, milestoneDue: e.target.value })} />
          </Field>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex items-center justify-end gap-3">
          {msg && <span className="text-[13px] font-medium text-success">{msg}</span>}
          <button type="submit" disabled={busy} className="btn-primary h-10 px-[18px]">
            {busy && <Spinner />}Save changes
          </button>
        </div>
      </form>

      <section className="flex flex-col gap-3 rounded-[14px] border border-danger-500/30 bg-white p-6">
        <h2 className="m-0 text-base font-bold text-danger">Delete project</h2>
        <p className="m-0 text-[13px] leading-normal text-muted">Deletes tasks, sessions, secrets, services, docs and conversations for this project. This can&apos;t be undone.</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="sr-only-x" htmlFor="ps-confirm">
            Type the project name to confirm
          </label>
          <input id="ps-confirm" className="input max-w-[280px]" placeholder={`Type “${project.name}” to confirm`} value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
          <button type="button" disabled={confirmName !== project.name} onClick={destroy} className="btn-danger h-10">
            Delete project
          </button>
        </div>
      </section>
    </main>
  );
}
