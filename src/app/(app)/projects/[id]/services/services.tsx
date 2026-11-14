"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/page-header";
import { api, Drawer, ErrorNote, Field, Spinner } from "@/components/ui";
import { ENV_META, SERVICE_CATALOG, SIGN_IN_OPTIONS } from "@/lib/catalog";

export type ServiceDTO = { id: string; catalogId: string; name: string; category: string; usedFor: string; accountEmail: string; signInWith: string; plan: string; region: string; dashboardUrl: string; envVars: string[]; environments: string[]; notes: string };

const AUTH_DOT: Record<string, string> = { "Google account": "#C5372C", "GitHub account": "#24292F", "Email & password": "#64748B", SSO: "#5B44B8" };
const AV = ["#0A8D7C", "#F6921E", "#3B6FD8", "#7A5AF8", "#D6457A"];
const FREE = /^(free|hobby|developer|starter)?$/i;

function Mark({ catalogId, name }: { catalogId: string; name: string }) {
  const c = SERVICE_CATALOG.find((x) => x.id === catalogId);
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: c?.c ?? "#64748B" }}>
      {c?.short ?? name.slice(0, 2).toUpperCase()}
    </span>
  );
}

type Draft = Omit<ServiceDTO, "id" | "envVars" | "category"> & { id?: string; customName: string; createVaultKeys: boolean };
const blank = (): Draft => ({ catalogId: SERVICE_CATALOG[0].id, name: "", customName: "", usedFor: "", accountEmail: "", signInWith: "Google account", plan: "", region: "", dashboardUrl: "", environments: ["development"], notes: "", createVaultKeys: true });

export function Services({ projectId, services, linkedVars }: { projectId: string; services: ServiceDTO[]; linkedVars: number }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = services.filter((s) => !q || `${s.name} ${s.accountEmail} ${s.usedFor}`.toLowerCase().includes(q.toLowerCase()));
  const groups = useMemo(() => {
    const m = new Map<string, ServiceDTO[]>();
    filtered.forEach((s) => m.set(s.category, [...(m.get(s.category) ?? []), s]));
    return [...m.entries()];
  }, [filtered]);
  const accounts = useMemo(() => {
    const m = new Map<string, { names: string[]; via: Set<string> }>();
    services.filter((s) => s.accountEmail).forEach((s) => {
      const e = m.get(s.accountEmail) ?? { names: [], via: new Set<string>() };
      e.names.push(s.name);
      e.via.add(s.signInWith);
      m.set(s.accountEmail, e);
    });
    return [...m.entries()];
  }, [services]);
  const paid = services.filter((s) => !FREE.test(s.plan.trim()));
  const missing = services.filter((s) => !s.accountEmail);
  const sharedInbox = services.filter((s) => /^(billing|ops|admin|team|info|dev)@/i.test(s.accountEmail));
  const catDef = draft ? SERVICE_CATALOG.find((c) => c.id === draft.catalogId) : undefined;

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const json = { usedFor: draft.usedFor, accountEmail: draft.accountEmail, signInWith: draft.signInWith, plan: draft.plan, region: draft.region, dashboardUrl: draft.dashboardUrl, environments: draft.environments, notes: draft.notes };
      if (draft.id) await api(`/api/projects/${projectId}/services/${draft.id}`, { method: "PATCH", json });
      else await api(`/api/projects/${projectId}/services`, { method: "POST", json: { ...json, catalogId: draft.catalogId, name: draft.customName, createVaultKeys: draft.createVaultKeys } });
      setDraft(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function remove() {
    if (!draft?.id || !confirm(`Remove ${draft.name}? Vault secrets are kept.`)) return;
    await api(`/api/projects/${projectId}/services/${draft.id}`, { method: "DELETE" });
    setDraft(null);
    router.refresh();
  }

  const stats = [
    { l: "Services", v: services.length, n: `Across ${new Set(services.map((s) => s.category)).size} categories` },
    { l: "Login accounts", v: accounts.length, n: `${accounts.filter(([e]) => e.endsWith("@gmail.com")).length} Gmail · ${accounts.filter(([e]) => !e.endsWith("@gmail.com")).length} other` },
    { l: "Paid plans", v: paid.length, n: paid.map((s) => s.name).slice(0, 3).join(", ") || "None recorded" },
    { l: "Linked env vars", v: linkedVars, n: "Stored encrypted in Vault" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3 max-sm:px-4">
        <h2 className="m-0 flex-1 text-base font-bold">Services &amp; accounts</h2>
        <button type="button" onClick={() => setDraft(blank())} className="btn-primary">
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Add service
        </button>
      </div>
      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-[18px] px-6 pt-[22px] pb-10 max-sm:px-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {stats.map((s) => (
            <div key={s.l} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white px-4 py-3.5">
              <span className="text-xs font-medium text-muted">{s.l}</span>
              <span className="text-2xl font-bold tracking-[-0.02em]">{s.v}</span>
              <span className="truncate text-xs text-muted">{s.n}</span>
            </div>
          ))}
        </div>

        {services.length === 0 ? (
          <EmptyState icon="layers" title="No services yet" action={<button type="button" onClick={() => setDraft(blank())} className="btn-primary">Add service</button>}>
            Record which third-party services this project uses and which login owns each one — so you never wonder which Gmail you used.
          </EmptyState>
        ) : (
          <div className="flex flex-wrap items-start gap-[18px]">
            <section aria-label="Services" className="card min-w-0 flex-[999_1_560px] overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-3">
                <h3 className="m-0 flex-1 text-[15px] font-semibold">All services</h3>
                <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-muted">
                  <Icon name="search" size={14} />
                  <span className="sr-only-x">Search services</span>
                  <input placeholder="Search service or email" value={q} onChange={(e) => setQ(e.target.value)} className="w-[160px] border-0 bg-transparent text-[13px] text-ink outline-none" />
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#FBFBFC] text-left text-xs text-muted">
                      <th className="px-4 py-2.5 font-medium">Service</th>
                      <th className="px-3 py-2.5 font-medium">Account</th>
                      <th className="px-3 py-2.5 font-medium">Plan · Region</th>
                      <th className="px-3 py-2.5 font-medium">Env vars</th>
                      <th className="py-2.5 pr-4 pl-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(([cat, rows]) => (
                      <GroupRows key={cat} cat={cat} rows={rows} projectId={projectId} onEdit={(s) => setDraft({ ...s, customName: s.name, createVaultKeys: false })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
              <section className="card flex flex-col gap-3 px-[18px] py-4">
                <div>
                  <h3 className="m-0 text-[15px] font-semibold">Login accounts</h3>
                  <p className="m-0 mt-1 text-xs text-muted">Which email owns which service.</p>
                </div>
                {accounts.length === 0 && <span className="text-[13px] text-muted">No account emails recorded yet.</span>}
                {accounts.map(([email, a], i) => (
                  <div key={email} className="flex flex-col gap-2 rounded-[10px] border border-line-soft p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: AV[i % AV.length] }}>
                        {email[0].toUpperCase()}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-semibold">{email}</span>
                        <span className="text-xs text-muted">via {[...a.via].join(" & ")}</span>
                      </span>
                      <span className="text-xs font-bold text-brand">{a.names.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-[5px]">
                      {a.names.map((n) => (
                        <span key={n} className="rounded-[5px] bg-chip px-[7px] py-0.5 text-[11px] font-medium text-ink-2">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
              {(missing.length > 0 || sharedInbox.length > 0) && (
                <section className="flex flex-col gap-2 rounded-[14px] border border-warn-line bg-warn-25 px-[18px] py-4">
                  <h3 className="m-0 text-sm font-semibold">Needs attention</h3>
                  {missing.map((s) => (
                    <span key={s.id} className="text-[13px] leading-normal text-ink-2">
                      <strong>{s.name}</strong> has no account email recorded yet.
                    </span>
                  ))}
                  {sharedInbox.map((s) => (
                    <span key={s.id} className="text-[13px] leading-normal text-ink-2">
                      <strong>{s.name}</strong> uses a shared inbox — consider adding a backup owner.
                    </span>
                  ))}
                </section>
              )}
            </aside>
          </div>
        )}
      </main>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? `Edit ${draft.name}` : "Add service"}
        footer={
          <>
            {draft?.id && (
              <button type="button" onClick={remove} className="btn-ghost mr-auto text-danger">
                Remove
              </button>
            )}
            <button type="button" onClick={() => setDraft(null)} className="btn-secondary h-10 px-4 font-semibold text-ink">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={busy} className="btn-primary h-10 px-[18px]">
              {busy && <Spinner />}Save service
            </button>
          </>
        }
      >
        {draft && (
          <>
            {!draft.id && (
              <Field label="Service" htmlFor="d-svc">
                <select id="d-svc" className="input" value={draft.catalogId} onChange={(e) => setDraft({ ...draft, catalogId: e.target.value })}>
                  {SERVICE_CATALOG.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="custom">Other…</option>
                </select>
              </Field>
            )}
            {!draft.id && draft.catalogId === "custom" && (
              <Field label="Service name" htmlFor="d-name">
                <input id="d-name" className="input" value={draft.customName} onChange={(e) => setDraft({ ...draft, customName: e.target.value })} />
              </Field>
            )}
            <Field label="Used for" htmlFor="d-use">
              <input id="d-use" className="input" placeholder="Rate limiting and job queue" value={draft.usedFor} onChange={(e) => setDraft({ ...draft, usedFor: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <Field label="Account email" htmlFor="d-email">
                <input id="d-email" type="email" className="input" placeholder="you@gmail.com" value={draft.accountEmail} onChange={(e) => setDraft({ ...draft, accountEmail: e.target.value })} />
              </Field>
              <Field label="Signs in with" htmlFor="d-sign">
                <select id="d-sign" className="input" value={draft.signInWith} onChange={(e) => setDraft({ ...draft, signInWith: e.target.value })}>
                  {SIGN_IN_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Plan" htmlFor="d-plan">
                <input id="d-plan" className="input" placeholder="Free / Pro" value={draft.plan} onChange={(e) => setDraft({ ...draft, plan: e.target.value })} />
              </Field>
              <Field label="Region / resource" htmlFor="d-region">
                <input id="d-region" className="input" placeholder="us-east-1 · cache" value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
              </Field>
            </div>
            <Field label="Dashboard URL" htmlFor="d-url">
              <input id="d-url" className="input font-mono text-xs" placeholder={catDef?.url ?? "https://…"} value={draft.dashboardUrl} onChange={(e) => setDraft({ ...draft, dashboardUrl: e.target.value })} />
            </Field>
            <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
              <legend className="label mb-1.5">Environments</legend>
              <div className="flex flex-wrap gap-2">
                {ENV_META.map((e) => (
                  <label key={e.id} className="inline-flex items-center gap-1.5 rounded-lg border border-field px-2.5 py-[7px] text-[13px]">
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={draft.environments.includes(e.id)}
                      onChange={(ev) => setDraft({ ...draft, environments: ev.target.checked ? [...draft.environments, e.id] : draft.environments.filter((x) => x !== e.id) })}
                    />
                    {e.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {!draft.id && catDef && catDef.env.length > 0 && (
              <div className="flex flex-col gap-2 rounded-[10px] border border-line-soft bg-canvas p-3">
                <span className="text-[13px] font-semibold">Suggested env vars</span>
                <div className="flex flex-wrap gap-1.5">
                  {catDef.env.map((k) => (
                    <span key={k} className="rounded-md border border-line bg-white px-2 py-[3px] font-mono text-xs">
                      {k}
                    </span>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[13px] text-ink-2">
                  <input type="checkbox" className="accent-brand" checked={draft.createVaultKeys} onChange={(e) => setDraft({ ...draft, createVaultKeys: e.target.checked })} />
                  Create these keys in the Vault (values added there, encrypted)
                </label>
              </div>
            )}
            <Field label="Notes" htmlFor="d-notes">
              <textarea id="d-notes" rows={3} className="input-area" placeholder="Limits, gotchas, who has access…" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </Field>
            <ErrorNote>{error}</ErrorNote>
          </>
        )}
      </Drawer>
    </>
  );
}

function GroupRows({ cat, rows, projectId, onEdit }: { cat: string; rows: ServiceDTO[]; projectId: string; onEdit: (s: ServiceDTO) => void }) {
  return (
    <>
      <tr>
        <td colSpan={5} className="border-t border-line-soft bg-[#FBFBFC] px-4 pt-2.5 pb-1.5 text-[11px] font-bold tracking-[.06em] text-muted uppercase">
          {cat} · {rows.length}
        </td>
      </tr>
      {rows.map((r) => (
        <tr key={r.id}>
          <td className="border-t border-line-row px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Mark catalogId={r.catalogId} name={r.name} />
              <span className="flex flex-col">
                <span className="font-semibold">{r.name}</span>
                <span className="text-xs text-muted">{r.usedFor || "—"}</span>
              </span>
            </div>
          </td>
          <td className="border-t border-line-row p-3">
            <div className="flex flex-col gap-[3px]">
              <span className={r.accountEmail ? "font-medium" : "text-muted"}>{r.accountEmail || "Not recorded"}</span>
              <span className="inline-flex items-center gap-[5px] text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: AUTH_DOT[r.signInWith] ?? "#64748B" }} />
                {r.signInWith}
              </span>
            </div>
          </td>
          <td className="border-t border-line-row p-3">
            <div className="flex flex-col gap-[3px]">
              <span className={`self-start rounded-[5px] px-[7px] py-px text-xs font-semibold ${FREE.test(r.plan.trim()) ? "bg-chip text-ink-3" : "bg-brand-50 text-brand"}`}>{r.plan || "Unknown"}</span>
              <span className="text-xs text-muted">{r.region}</span>
            </div>
          </td>
          <td className="border-t border-line-row p-3">
            <Link href={`/projects/${projectId}/vault`} className="inline-flex items-center gap-[5px] rounded-md border border-line bg-[#F3F4F6] px-2 py-[3px] text-xs font-semibold text-ink-2">
              <Icon name="padlock" size={11} strokeWidth={2.4} className="text-brand" />
              {r.envVars.length} {r.envVars.length === 1 ? "key" : "keys"}
            </Link>
          </td>
          <td className="border-t border-line-row py-3 pr-4 pl-3">
            <div className="flex justify-end gap-1">
              {r.dashboardUrl && (
                <a href={r.dashboardUrl} target="_blank" rel="noreferrer" aria-label={`Open ${r.name} dashboard`} className="icon-btn">
                  <Icon name="external" size={14} />
                </a>
              )}
              <button type="button" onClick={() => onEdit(r)} aria-label={`Edit ${r.name}`} className="icon-btn">
                <Icon name="edit" size={14} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
