"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DatabaseConnect, type Provider } from "@/components/database-connect";
import { Icon } from "@/components/icons";
import { api, ErrorNote, Spinner } from "@/components/ui";

export function DatabaseForm() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("supabase");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState("");

  async function save(skip: boolean) {
    setBusy(skip ? "skip" : "save");
    setError("");
    try {
      const r = await api<{ next: string }>("/api/onboarding/database/save", { method: "POST", json: skip ? { skip: true } : { provider, url } });
      router.push(r.next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success">
          <Icon name="check" size={12} strokeWidth={2.6} />
          Email verified
        </span>
        <h1 className="m-0 text-[26px] leading-tight font-bold tracking-[-0.02em]">Which database provider do you use for your project?</h1>
        <p className="m-0 leading-normal text-muted">This becomes your default connection. You can add more connections later from Settings.</p>
      </div>
      <DatabaseConnect provider={provider} setProvider={setProvider} url={url} setUrl={setUrl} />
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
        <button type="button" onClick={() => save(true)} disabled={!!busy} className="font-medium text-ink-3">
          {busy === "skip" ? "Skipping…" : "Skip for now"}
        </button>
        <span className="flex-1" />
        <button type="button" onClick={() => save(false)} disabled={!!busy || url.length < 10} className="btn-primary h-[42px] px-[18px] text-sm">
          {busy === "save" && <Spinner />}Save and continue
          <Icon name="arrowRight" size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
