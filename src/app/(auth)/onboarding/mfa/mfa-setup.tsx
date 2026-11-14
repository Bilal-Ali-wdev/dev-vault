"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { OnboardingShell as OnboardingShellClient } from "@/components/onboarding-shell";
import { api, CodeInput, ErrorNote, Spinner } from "@/components/ui";

export function MfaSetup() {
  const [setup, setSetup] = useState<{ qr: string; key: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api<{ qr: string; key: string }>("/api/auth/mfa/setup").then(setSetup, (e) => setError(e.message));
  }, []);

  async function verify() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ recoveryCodes: string[] }>("/api/auth/mfa/enable", { method: "POST", json: { code } });
      setCodes(r.recoveryCodes);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  function copy(text: string, what: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(""), 1800);
    });
  }

  function download() {
    const blob = new Blob([`DevVault recovery codes\nEach code works once.\n\n${codes!.join("\n")}\n`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "devvault-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <OnboardingShellClient current={codes ? 4 : 3}>
      {!codes ? (
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[26px] font-bold tracking-[-0.02em]">Set up your authenticator app</h1>
            <p className="m-0 leading-normal text-muted">Works with Google Authenticator, Microsoft Authenticator, 1Password, Authy or any TOTP app. No Google account needed.</p>
          </div>
          <div className="flex flex-wrap items-center gap-[22px] rounded-[14px] border border-line p-5">
            <div className="flex h-[176px] w-[176px] flex-none items-center justify-center rounded-xl border border-line bg-white p-2.5">
              {setup ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={setup.qr} alt="QR code for your DevVault authenticator setup" width={156} height={156} />
              ) : (
                <Spinner size={20} />
              )}
            </div>
            <div className="flex flex-[1_1_220px] flex-col gap-3">
              <span className="flex gap-2.5 text-[13px] leading-normal text-ink-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand">1</span>Open your app and tap Add account.
              </span>
              <span className="flex gap-2.5 text-[13px] leading-normal text-ink-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand">2</span>Scan the QR code, or enter the key below.
              </span>
              <div className="flex items-center gap-2 rounded-[9px] border border-line bg-canvas py-1.5 pr-1.5 pl-3">
                <code className="flex-1 font-mono text-[13px] font-medium tracking-[0.06em] break-all">{setup?.key ?? "…"}</code>
                <button type="button" aria-label="Copy setup key" onClick={() => setup && copy(setup.key.replace(/ /g, ""), "key")} className="icon-btn">
                  <Icon name={copied === "key" ? "check" : "copy"} size={14} />
                </button>
              </div>
            </div>
          </div>
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 text-[13px] font-medium">Enter the 6-digit code from your app</legend>
            <CodeInput value={code} onChange={setCode} />
            <span className="text-xs text-muted">Codes refresh every 30 seconds.</span>
          </fieldset>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
            <Link href="/onboarding/database" className="btn-secondary h-11 px-4 font-semibold text-ink">
              Back
            </Link>
            <span className="flex-1" />
            <button type="button" onClick={verify} disabled={busy || code.length !== 6} className="btn-primary h-11 rounded-[10px] px-5 text-sm">
              {busy && <Spinner />}Verify and turn on MFA
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-success-50 text-success">
              <Icon name="check" size={22} strokeWidth={2.6} />
            </span>
            <div className="flex flex-col gap-0.5">
              <h1 className="m-0 text-2xl font-bold tracking-[-0.02em]">MFA is on</h1>
              <span className="text-muted">Save these recovery codes. Each works once, and we only show them now.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-dashed border-[#CBD2DA] bg-canvas p-5">
            {codes.map((c) => (
              <code key={c} className="font-mono text-[15px] font-medium tracking-[0.04em]">
                {c}
              </code>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={download} className="btn-secondary h-10 font-semibold text-ink">
              <Icon name="download" size={14} />
              Download .txt
            </button>
            <button type="button" onClick={() => copy(codes.join("\n"), "codes")} className="btn-secondary h-10 font-semibold text-ink">
              <Icon name={copied === "codes" ? "check" : "copy"} size={14} />
              {copied === "codes" ? "Copied" : "Copy all"}
            </button>
          </div>
          <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <input type="checkbox" className="accent-brand" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            I&apos;ve saved my recovery codes somewhere safe
          </label>
          <a
            href="/dashboard"
            aria-disabled={!saved}
            onClick={(e) => !saved && e.preventDefault()}
            className={`btn h-[46px] rounded-[10px] text-[15px] text-white hover:text-white ${saved ? "bg-brand hover:bg-brand-700" : "cursor-not-allowed bg-[#5E8F88]"}`}
          >
            Go to dashboard
            <Icon name="arrowRight" size={15} strokeWidth={2.2} />
          </a>
        </div>
      )}
    </OnboardingShellClient>
  );
}
