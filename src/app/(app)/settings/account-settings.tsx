"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DatabaseConnect, DB_PROVIDERS, type Provider } from "@/components/database-connect";
import { Icon } from "@/components/icons";
import { api, ErrorNote, Field, Modal, Spinner } from "@/components/ui";

type Db = { id: string; provider: Provider; label: string; hint: string; isDefault: boolean; lastTest: { ok: boolean; meta: string; ms: number; at: string } | null };

export function AccountSettings({ user, databases }: { user: { name: string; email: string; mfaSince: string; recoveryLeft: number }; databases: Db[] }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState<Provider>("supabase");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api("/api/auth/me", { method: "PATCH", json: { name } });
      setMsg("Saved.");
      router.refresh();
    } catch (err) {
      setMsg((err as Error).message);
    }
    setSaving(false);
  }

  async function addDb() {
    setBusy("add");
    setError("");
    try {
      await api("/api/onboarding/database/save", { method: "POST", json: { provider, url } });
      setAdding(false);
      setUrl("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  async function retest(id: string) {
    setBusy(id);
    await api(`/api/databases/${id}`, { method: "POST" }).catch(() => null);
    router.refresh();
    setBusy(null);
  }

  async function removeDb(id: string) {
    if (!confirm("Remove this connection?")) return;
    await api(`/api/databases/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-[820px] flex-col gap-[18px] px-6 pt-7 pb-10 max-sm:px-4">
      <form onSubmit={saveName} className="card flex flex-col gap-4 p-6">
        <h2 className="m-0 text-lg font-bold">Profile</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <Field label="Full name" htmlFor="st-name">
            <input id="st-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="st-email" hint="Email changes aren't supported yet.">
            <input id="st-email" className="input bg-canvas text-muted" value={user.email} readOnly />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3">
          {msg && <span className="text-[13px] text-muted">{msg}</span>}
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary h-10 px-[18px]">
            {saving && <Spinner />}Save
          </button>
        </div>
      </form>

      <section className="card flex flex-col gap-3 p-6">
        <h2 className="m-0 text-lg font-bold">Security</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line-soft p-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-success-50 text-success">
            <Icon name="shieldCheck" size={18} />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="font-semibold">Authenticator app (TOTP) is on</span>
            <span className="text-xs text-muted">Since {user.mfaSince}</span>
          </div>
          <span className={`pill ${user.recoveryLeft <= 3 ? "bg-warn-50 text-warn" : "bg-chip text-ink-2"}`}>{user.recoveryLeft} recovery codes left</span>
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0 flex-1 text-lg font-bold">Database connections</h2>
          <button type="button" onClick={() => setAdding(true)} className="btn-secondary">
            <Icon name="plus" size={14} />
            Add connection
          </button>
        </div>
        {databases.length === 0 && <p className="m-0 text-[13px] text-muted">No connections saved.</p>}
        {databases.map((d) => {
          const p = DB_PROVIDERS[d.provider];
          return (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line-soft p-3.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg font-mono text-xs font-bold" style={{ background: p.bg, color: p.c }}>
                {p.logo}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">
                  {d.label} {d.isDefault && <span className="pill ml-1 bg-brand-50 text-brand">Default</span>}
                </span>
                <span className="truncate font-mono text-xs text-muted">{d.hint}</span>
                {d.lastTest && (
                  <span className={`text-xs ${d.lastTest.ok ? "text-success" : "text-danger"}`}>
                    {d.lastTest.ok ? `Connected · ${d.lastTest.ms} ms · ${d.lastTest.meta}` : d.lastTest.meta} · {d.lastTest.at}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => retest(d.id)} disabled={busy === d.id} className="btn-secondary h-8 text-xs">
                {busy === d.id ? <Spinner /> : <Icon name="plug" size={13} />}Test
              </button>
              <button type="button" onClick={() => removeDb(d.id)} aria-label={`Remove ${d.label}`} className="icon-btn">
                <Icon name="trash" size={14} />
              </button>
            </div>
          );
        })}
      </section>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add database connection"
        footer={
          <button type="button" onClick={addDb} disabled={busy === "add" || url.length < 10} className="btn-primary h-10 px-[18px]">
            {busy === "add" && <Spinner />}Save connection
          </button>
        }
      >
        <DatabaseConnect provider={provider} setProvider={setProvider} url={url} setUrl={setUrl} />
        <ErrorNote>{error}</ErrorNote>
      </Modal>
    </main>
  );
}
