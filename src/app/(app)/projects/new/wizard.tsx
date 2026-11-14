"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { api, ErrorNote, Field, Spinner } from "@/components/ui";
import { PROJECT_TYPES, SERVICE_CATALOG, SERVICE_CATEGORIES, SIGN_IN_OPTIONS, STACK_GROUPS } from "@/lib/catalog";
import { cn } from "@/lib/format";

const STEPS = [
  ["Basics", "Name and links"],
  ["Tech stack", "Frameworks and DB"],
  ["Services", "Third-party accounts"],
  ["Review", "Create project"],
];
const AV = ["#0A8D7C", "#F6921E", "#3B6FD8", "#7A5AF8"];
type Acct = { email: string; signIn: string; plan: string; region: string; url: string; notes: string };

export function Wizard({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState({ name: "", type: PROJECT_TYPES[0], description: "", status: "Planning", startDate: "", repoUrl: "", liveUrl: "" });
  const [stack, setStack] = useState<Record<string, boolean>>({});
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [f, setF] = useState<Record<string, Acct>>({});
  const [openId, setOpenId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = SERVICE_CATALOG.filter((s) => sel[s.id]);
  const acct = (id: string): Acct => f[id] ?? { email: defaultEmail, signIn: "Google account", plan: "", region: "", url: "", notes: "" };
  const setAcct = (id: string, k: keyof Acct, v: string) => setF({ ...f, [id]: { ...acct(id), [k]: v } });
  const accounts = useMemo(() => {
    const m = new Map<string, string[]>();
    selected.forEach((s) => {
      const e = acct(s.id).email;
      if (e) m.set(e, [...(m.get(e) ?? []), s.name]);
    });
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, f]);
  const stackList = Object.keys(stack).filter((k) => stack[k]);
  const catalog = SERVICE_CATALOG.filter((s) => (cat === "All" || s.cat === cat) && (!q || s.name.toLowerCase().includes(q.toLowerCase())));

  function next() {
    setError("");
    if (step === 0) {
      if (!basics.name.trim()) return setError("Give the project a name.");
      for (const [k, v] of [["Repository URL", basics.repoUrl], ["Live URL", basics.liveUrl]]) {
        if (v && !/^https?:\/\/\S+$/.test(v.trim())) return setError(`${k} must start with https://`);
      }
    }
    setStep(Math.min(3, step + 1));
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ id: string }>("/api/projects", {
        method: "POST",
        json: {
          ...basics,
          repoUrl: basics.repoUrl.trim(),
          liveUrl: basics.liveUrl.trim(),
          startDate: basics.startDate || null,
          stack: stackList,
          services: selected.map((s) => {
            const a = acct(s.id);
            return { catalogId: s.id, accountEmail: a.email, signInWith: a.signIn, plan: a.plan, region: a.region, dashboardUrl: a.url, notes: a.notes };
          }),
          createVaultKeys: true,
        },
      });
      router.push(`/projects/${r.id}/services`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <header className="flex h-[60px] flex-wrap items-center gap-3 border-b border-line bg-white px-6 max-sm:px-4">
        <Link href="/dashboard" className="text-muted">
          Projects
        </Link>
        <span className="text-faint">/</span>
        <span className="font-semibold">New project</span>
        <span className="flex-1" />
        <Link href="/dashboard" className="btn-secondary h-[34px]">
          Cancel
        </Link>
      </header>

      <div className="overflow-x-auto border-b border-line bg-white px-6 py-3.5">
        <ol className="mx-auto flex max-w-[1080px] min-w-[640px] list-none items-center gap-2.5 p-0">
          {STEPS.map(([t, d], i) => {
            const done = i < step;
            const cur = i === step;
            return (
              <li key={t} className="flex flex-1 items-center gap-2.5">
                <button type="button" onClick={() => i < step && setStep(i)} className="flex items-center gap-2.5 p-0 text-left" aria-current={cur ? "step" : undefined}>
                  <span className={cn("flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold", done ? "bg-success-500 text-white" : cur ? "bg-brand text-white" : "border-[1.5px] border-[#CBD2DA] text-muted")}>
                    {done ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="flex flex-col">
                    <span className={cn("text-[13px]", cur ? "font-bold text-ink" : "font-semibold text-ink-3")}>{t}</span>
                    <span className="text-xs text-muted">{d}</span>
                  </span>
                </button>
                {i < 3 && <span className={cn("h-0.5 min-w-5 flex-1 rounded-sm", done ? "bg-success-500" : "bg-line")} />}
              </li>
            );
          })}
        </ol>
      </div>

      <main className="mx-auto flex w-full max-w-[1180px] flex-wrap items-start gap-5 p-6 max-sm:px-4">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
          {step === 0 && (
            <section className="card flex flex-col gap-[18px] p-6">
              <div>
                <h1 className="m-0 text-xl font-bold">Project basics</h1>
                <p className="m-0 mt-1 text-muted">Name it and tell DevVault what it is.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                <Field label="Project name" htmlFor="pname">
                  <input id="pname" autoFocus className="input h-10 rounded-lg" placeholder="Storefront API" value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} />
                </Field>
                <Field label="Project type" htmlFor="ptype">
                  <select id="ptype" className="input h-10 rounded-lg" value={basics.type} onChange={(e) => setBasics({ ...basics, type: e.target.value })}>
                    {PROJECT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Description" htmlFor="pdesc" className="col-span-full">
                  <textarea id="pdesc" rows={3} className="input-area" placeholder="Headless commerce backend for the Acme storefront" value={basics.description} onChange={(e) => setBasics({ ...basics, description: e.target.value })} />
                </Field>
                <Field label="Status" htmlFor="pstatus">
                  <select id="pstatus" className="input h-10 rounded-lg" value={basics.status} onChange={(e) => setBasics({ ...basics, status: e.target.value })}>
                    {["Planning", "Active", "On Hold", "Paused"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Start date" htmlFor="pstart">
                  <input id="pstart" type="date" className="input h-10 rounded-lg" value={basics.startDate} onChange={(e) => setBasics({ ...basics, startDate: e.target.value })} />
                </Field>
                <Field label="Repository URL" htmlFor="prepo">
                  <input id="prepo" className="input h-10 rounded-lg" placeholder="https://github.com/acme/storefront-api" value={basics.repoUrl} onChange={(e) => setBasics({ ...basics, repoUrl: e.target.value })} />
                </Field>
                <Field label="Live URL" htmlFor="plive">
                  <input id="plive" className="input h-10 rounded-lg" placeholder="https://shop.acme.io" value={basics.liveUrl} onChange={(e) => setBasics({ ...basics, liveUrl: e.target.value })} />
                </Field>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="card flex flex-col gap-5 p-6">
              <div>
                <h1 className="m-0 text-xl font-bold">Tech stack</h1>
                <p className="m-0 mt-1 text-muted">Pick what this project is built with. The AI uses this as context.</p>
              </div>
              {STACK_GROUPS.map((g) => (
                <div key={g.label} className="flex flex-col gap-2.5">
                  <span className="text-[13px] font-semibold">{g.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={!!stack[n]}
                        onClick={() => setStack({ ...stack, [n]: !stack[n] })}
                        className={cn("h-[34px] rounded-full px-3.5 text-[13px] font-medium", stack[n] ? "border-[1.5px] border-brand-500 bg-brand-50 text-brand" : "border border-field bg-white text-ink-2")}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {step === 2 && (
            <>
              <section className="card flex flex-col gap-[18px] p-6">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[240px] flex-1">
                    <h1 className="m-0 text-xl font-bold">Third-party services</h1>
                    <p className="m-0 mt-1 leading-normal text-muted">Which services does this project use, and which account owns each one? You can add more later.</p>
                  </div>
                  <label className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-muted">
                    <Icon name="search" size={14} />
                    <span className="sr-only-x">Search services</span>
                    <input placeholder="Search services" value={q} onChange={(e) => setQ(e.target.value)} className="w-[150px] border-0 bg-transparent text-[13px] text-ink outline-none" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setCat(c)} className={cn("h-[30px] rounded-full border px-3 text-xs font-semibold", cat === c ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-3")}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
                  {catalog.map((s) => {
                    const on = !!sel[s.id];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setSel({ ...sel, [s.id]: !on });
                          if (!on) setOpenId(s.id);
                        }}
                        className={cn("flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left", on ? "border-[1.5px] border-brand-500 bg-brand-25" : "border border-line bg-white")}
                      >
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: s.c }}>
                          {s.short}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col items-start gap-px">
                          <span className="max-w-full truncate text-[13px] font-semibold text-ink">{s.name}</span>
                          <span className="text-[11px] text-muted">{s.cat}</span>
                        </span>
                        <span className={cn("flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full", on ? "bg-brand text-white" : "border-[1.5px] border-[#CBD2DA] text-transparent")}>
                          <Icon name="check" size={11} strokeWidth={3.4} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {selected.length > 0 && (
                <section className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-5 py-4">
                    <h2 className="m-0 text-[15px] font-semibold">Account details · {selected.length} selected</h2>
                    <span className="text-xs text-muted">Passwords and keys go in the Vault, not here</span>
                  </div>
                  {selected.map((s) => {
                    const a = acct(s.id);
                    const isOpen = openId === s.id;
                    return (
                      <div key={s.id} className="border-b border-line-soft last:border-0">
                        <button type="button" onClick={() => setOpenId(isOpen ? "" : s.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: s.c }}>
                            {s.short}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-semibold text-ink">{s.name}</span>
                            <span className="truncate text-xs text-muted">{a.email ? `${a.email} · ${a.signIn}${a.plan ? " · " + a.plan : ""}` : "Account not set yet"}</span>
                          </span>
                          <span className={cn("rounded-md px-2 py-[3px] text-[11px] font-semibold", a.email ? "bg-success-50 text-success" : "bg-warn-50 text-warn")}>{a.email ? "Complete" : "Needs account"}</span>
                          <Icon name={isOpen ? "chevronUp" : "chevronDown"} className="text-muted" />
                        </button>
                        {isOpen && (
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 px-5 pb-5 pl-16 max-sm:pl-5">
                            <Field label="Account email used" htmlFor={`${s.id}-e`}>
                              <input id={`${s.id}-e`} type="email" className="input-sm" placeholder="you@gmail.com" value={a.email} onChange={(e) => setAcct(s.id, "email", e.target.value)} />
                            </Field>
                            <Field label="Signs in with" htmlFor={`${s.id}-s`}>
                              <select id={`${s.id}-s`} className="input-sm" value={a.signIn} onChange={(e) => setAcct(s.id, "signIn", e.target.value)}>
                                {SIGN_IN_OPTIONS.map((o) => (
                                  <option key={o}>{o}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Plan" htmlFor={`${s.id}-p`}>
                              <input id={`${s.id}-p`} className="input-sm" placeholder="Free" value={a.plan} onChange={(e) => setAcct(s.id, "plan", e.target.value)} />
                            </Field>
                            <Field label="Region / resource name" htmlFor={`${s.id}-r`}>
                              <input id={`${s.id}-r`} className="input-sm" placeholder="us-east-1 · storefront-cache" value={a.region} onChange={(e) => setAcct(s.id, "region", e.target.value)} />
                            </Field>
                            <Field label="Dashboard URL" htmlFor={`${s.id}-u`} className="col-span-full">
                              <input id={`${s.id}-u`} className="input-sm font-mono text-xs" placeholder={s.url} value={a.url} onChange={(e) => setAcct(s.id, "url", e.target.value)} />
                            </Field>
                            <div className="col-span-full flex flex-col gap-2">
                              <span className="text-xs font-medium text-ink-2">Environment variables for this service</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {s.env.map((e) => (
                                  <span key={e} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-[#F3F4F6] px-2 py-[3px] font-mono text-xs">
                                    <Icon name="padlock" size={11} strokeWidth={2.4} className="text-brand" />
                                    {e}
                                  </span>
                                ))}
                                <span className="text-xs text-muted">Created empty in the Vault — add values there.</span>
                              </div>
                            </div>
                            <Field label="Notes" htmlFor={`${s.id}-n`} className="col-span-full">
                              <input id={`${s.id}-n`} className="input-sm" placeholder="What it's used for, limits, gotchas…" value={a.notes} onChange={(e) => setAcct(s.id, "notes", e.target.value)} />
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              )}
            </>
          )}

          {step === 3 && (
            <section className="card flex flex-col gap-[18px] p-6">
              <div>
                <h1 className="m-0 text-xl font-bold">Review and create</h1>
                <p className="m-0 mt-1 text-muted">Everything here can be edited later from the project.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                <div className="rounded-[10px] bg-canvas p-3.5">
                  <div className="text-xs text-muted">Project</div>
                  <div className="mt-1 font-semibold">{basics.name}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {basics.type} · {basics.status}
                  </div>
                </div>
                <div className="rounded-[10px] bg-canvas p-3.5">
                  <div className="text-xs text-muted">Stack</div>
                  <div className="mt-1 font-semibold">{stackList.join(" · ") || "—"}</div>
                </div>
                <div className="rounded-[10px] bg-canvas p-3.5">
                  <div className="text-xs text-muted">Services</div>
                  <div className="mt-1 font-semibold">
                    {selected.length} services · {accounts.length} accounts
                  </div>
                </div>
              </div>
              {selected.length > 0 && (
                <div className="overflow-x-auto rounded-[10px] border border-line">
                  <table className="w-full min-w-[560px] border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-[#FBFBFC] text-left text-xs text-muted">
                        <th className="px-3.5 py-2.5 font-medium">Service</th>
                        <th className="px-3.5 py-2.5 font-medium">Account</th>
                        <th className="px-3.5 py-2.5 font-medium">Sign-in</th>
                        <th className="px-3.5 py-2.5 font-medium">Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.map((s) => (
                        <tr key={s.id}>
                          <td className="border-t border-line-row px-3.5 py-2.5 font-semibold">{s.name}</td>
                          <td className="border-t border-line-row px-3.5 py-2.5">{acct(s.id).email || "—"}</td>
                          <td className="border-t border-line-row px-3.5 py-2.5 text-muted">{acct(s.id).signIn}</td>
                          <td className="border-t border-line-row px-3.5 py-2.5 text-muted">{acct(s.id).plan || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <ErrorNote>{error}</ErrorNote>
          <div className="flex flex-wrap items-center gap-2.5">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary h-10 px-4 font-semibold text-ink">
                Back
              </button>
            )}
            <span className="flex-1" />
            {step === 2 && (
              <button type="button" onClick={next} className="btn-ghost h-10">
                Skip, add later
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={next} className="btn-primary h-10 px-[18px]">
                Continue
              </button>
            ) : (
              <button type="button" onClick={create} disabled={busy} className="btn-primary h-10 px-[18px]">
                {busy && <Spinner />}Create project
              </button>
            )}
          </div>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <section className="card flex flex-col gap-3.5 p-[18px]">
            <div>
              <h2 className="m-0 text-[15px] font-semibold">Accounts in this project</h2>
              <p className="m-0 mt-1 text-xs leading-normal text-muted">Which login owns which service — so you never wonder which Gmail you used.</p>
            </div>
            {accounts.length === 0 && <span className="text-[13px] text-muted">Pick services in step 3 to see them here.</span>}
            {accounts.map(([email, names], i) => (
              <div key={email} className="flex flex-col gap-2 rounded-[10px] border border-line-soft p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: AV[i % AV.length] }}>
                    {email[0].toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold">{email}</span>
                    <span className="text-xs text-muted">
                      {names.length} {names.length === 1 ? "service" : "services"}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-[5px]">
                  {names.map((n) => (
                    <span key={n} className="rounded-[5px] bg-chip px-[7px] py-0.5 text-[11px] font-medium text-ink-2">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
          <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 p-3.5 text-xs leading-normal text-[#134E48]">
            <Icon name="shield" className="mt-px text-brand" />
            Account emails and service notes are private to your workspace. Secret values live only in the encrypted Vault and are never sent to AI.
          </div>
        </aside>
      </main>
    </>
  );
}
