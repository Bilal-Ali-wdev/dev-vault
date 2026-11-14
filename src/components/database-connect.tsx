"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { api, ErrorNote, Spinner } from "./ui";

export const DB_PROVIDERS = {
  supabase: {
    label: "Supabase connection URL",
    ph: "postgresql://postgres.[ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres",
    help: "Supabase runs on PostgreSQL. Use the pooled (port 6543) URL for serverless deployments and the direct (5432) URL for long-running servers. Find both under Project Settings → Database.",
    logo: "SB",
    c: "#1F7A4D",
    bg: "#E6F5EC",
  },
  mongodb: {
    label: "MongoDB connection URL",
    ph: "mongodb+srv://[user]:[password]@cluster0.example.mongodb.net/[db]",
    help: "Standard mongodb:// and Atlas mongodb+srv:// strings are supported. In Atlas, open Connect → Drivers and allowlist the server's IP address.",
    logo: "MG",
    c: "#1F7A4D",
    bg: "#E6F5EC",
  },
  postgres: {
    label: "PostgreSQL connection URL",
    ph: "postgresql://[user]:[password]@db.example.com:5432/[database]?sslmode=require",
    help: "Any reachable PostgreSQL 12+ server. Add sslmode=require for TLS. Self-hosted servers on private networks can't be tested from DevVault.",
    logo: "PG",
    c: "#2B56B0",
    bg: "#EAF0FC",
  },
} as const;
export type Provider = keyof typeof DB_PROVIDERS;

type TestResult = { ok: true; ms: number; meta: string } | { ok: false; error: string };

/** Provider select + URL + server-side connection test. Used in onboarding and settings. */
export function DatabaseConnect({ provider, setProvider, url, setUrl }: { provider: Provider; setProvider: (p: Provider) => void; url: string; setUrl: (u: string) => void }) {
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const p = DB_PROVIDERS[provider];

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      setResult(await api<TestResult>("/api/onboarding/database/test", { method: "POST", json: { provider, url } }));
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    }
    setTesting(false);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="provider" className="label">
          Database provider
        </label>
        <select
          id="provider"
          className="input"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as Provider);
            setResult(null);
          }}
        >
          <option value="supabase">Supabase</option>
          <option value="mongodb">MongoDB</option>
          <option value="postgres">PostgreSQL</option>
        </select>
      </div>
      <div className="flex items-start gap-3 rounded-[10px] border border-line-soft bg-canvas px-3.5 py-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg font-mono text-xs font-bold" style={{ background: p.bg, color: p.c }}>
          {p.logo}
        </span>
        <p className="m-0 text-[13px] leading-relaxed text-ink-2">{p.help}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dburl" className="label">
          {p.label}
        </label>
        <div className="flex h-11 items-center rounded-[9px] border border-field pr-1 pl-3 focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_var(--color-brand-50)]">
          <input
            id="dburl"
            type={show ? "text" : "password"}
            placeholder={p.ph}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[13px] text-ink outline-none"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setResult(null);
            }}
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide URL" : "Show URL"} className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-muted">
            <Icon name={show ? "eyeOff" : "eye"} />
          </button>
        </div>
        <span className="text-xs text-muted">Use a least-privilege user. The URL is encrypted on our servers and never shown again in full.</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={test} disabled={testing || url.length < 10} className="btn-secondary h-[38px] font-semibold">
          {testing ? <Spinner /> : <Icon name="plug" size={14} />}Test connection
        </button>
        {result?.ok && (
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            Connected · {result.ms} ms · {result.meta}
          </span>
        )}
      </div>
      {result && !result.ok && <ErrorNote>{result.error}</ErrorNote>}
      <div className="flex items-start gap-2.5 text-xs leading-normal text-muted">
        <Icon name="shield" size={15} className="mt-px text-brand" />
        Tests run server-side with a 5-second timeout. Private IP ranges are blocked, and connection strings are never logged or sent to AI.
      </div>
    </>
  );
}
