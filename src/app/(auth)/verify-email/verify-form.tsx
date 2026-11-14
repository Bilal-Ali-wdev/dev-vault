"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { api, CodeInput, ErrorNote, Spinner } from "@/components/ui";
import { cn } from "@/lib/format";

export function VerifyForm({ email, resendAt, devMode }: { email: string; resendAt: number; devMode: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [until, setUntil] = useState(resendAt);
  const [now, setNow] = useState(() => Date.now());
  const complete = code.length === 6;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const wait = Math.max(0, Math.ceil((until - now) / 1000));

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!complete) return;
    setBusy(true);
    setError("");
    try {
      const r = await api<{ next: string }>("/api/auth/verify-email", { method: "POST", json: { code } });
      router.push(r.next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    try {
      const r = await api<{ resendInMs: number; emailDelivered: boolean }>("/api/auth/resend-otp", { method: "POST" });
      setUntil(Date.now() + r.resendInMs);
      setCode("");
      setNotice(r.emailDelivered ? "A new code is on its way." : "New code generated — check the server console (email isn't configured yet).");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function changeEmail() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/signup");
    router.refresh();
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-[22px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-brand-50 text-brand">
        <Icon name="mail" size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.02em]">Check your email</h1>
        <p className="m-0 leading-normal text-muted">
          We sent a 6-digit code to <strong className="font-semibold text-ink">{email}</strong>. Enter it below to verify your account.{" "}
          <button type="button" onClick={changeEmail} className="font-semibold text-brand">
            Change email
          </button>
        </p>
      </div>
      {devMode && (
        <div className="rounded-[10px] border border-warn-line bg-warn-25 px-3.5 py-3 text-xs leading-normal text-ink-2">
          <strong className="text-warn">Dev mode:</strong> SMTP isn&apos;t configured, so the code is printed in the terminal running <code className="code-chip">npm run dev</code>.
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 text-[13px] font-medium">Verification code</legend>
        <CodeInput value={code} onChange={setCode} autoFocus />
        <span className={cn("text-xs", complete ? "font-semibold text-success" : "text-muted")}>{notice || (complete ? "Code complete — ready to verify." : "Paste the code or type it digit by digit.")}</span>
      </fieldset>
      <button type="submit" disabled={busy || !complete} className={cn("btn h-[46px] rounded-[10px] text-[15px] text-white", complete ? "bg-brand hover:bg-brand-700" : "bg-[#5E8F88]")}>
        {busy && <Spinner />}Verify email
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <span className="text-muted">Didn&apos;t get it? Check spam, or</span>
        {wait > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Icon name="clock" size={13} />
            Resend code in {Math.floor(wait / 60)}:{String(wait % 60).padStart(2, "0")}
          </span>
        ) : (
          <button type="button" onClick={resend} className="font-semibold text-brand">
            Resend code
          </button>
        )}
      </div>
      <div className="flex items-start gap-2.5 rounded-[10px] border border-line-soft bg-canvas px-3.5 py-3 text-xs leading-normal text-ink-3">
        <Icon name="shield" size={15} className="mt-px text-brand" />
        The code is single-use and expires in 10 minutes. After 5 wrong attempts we&apos;ll ask you to request a new one.
      </div>
    </form>
  );
}
