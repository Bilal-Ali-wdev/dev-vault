"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { api, CodeInput, ErrorNote, Spinner } from "@/components/ui";

export function MfaChallenge({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ next: string }>("/api/auth/mfa/challenge", { method: "POST", json: { code } });
      router.push(r.next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[22px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-brand-50 text-brand">
        <Icon name="shieldCheck" size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.02em]">Confirm it&apos;s you</h1>
        <p className="m-0 leading-normal text-muted">
          Signing in as <strong className="font-semibold text-ink">{email}</strong>.{" "}
          {recovery ? "Enter one of your recovery codes." : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {recovery ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rc" className="label">
            Recovery code
          </label>
          <input id="rc" autoFocus placeholder="XXXX-XXXX" className="input font-mono tracking-widest uppercase" value={code} onChange={(e) => setCode(e.target.value)} />
          <span className="text-xs text-muted">Each recovery code works once.</span>
        </div>
      ) : (
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 text-[13px] font-medium">Authentication code</legend>
          <CodeInput value={code} onChange={setCode} autoFocus />
          <span className="text-xs text-muted">Codes refresh every 30 seconds.</span>
        </fieldset>
      )}
      <button type="submit" disabled={busy || (!recovery && code.length !== 6)} className="btn-primary h-[46px] rounded-[10px] text-[15px]">
        {busy && <Spinner />}Verify
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <button
          type="button"
          className="font-semibold text-brand"
          onClick={() => {
            setRecovery(!recovery);
            setCode("");
            setError("");
          }}
        >
          {recovery ? "Use authenticator code" : "Use a recovery code"}
        </button>
        <button type="button" onClick={signOut} className="text-ink-3">
          Sign out
        </button>
      </div>
    </form>
  );
}
