"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { api, ErrorNote, Spinner } from "@/components/ui";
import { cn } from "@/lib/format";

const LEVELS = [
  ["Too short", "#B42323", "#D93F3F"],
  ["Weak", "#B42323", "#D93F3F"],
  ["Fair", "#8A5207", "#F6921E"],
  ["Good", "#077264", "#0A8D7C"],
  ["Strong", "#1F7A4D", "#39AA70"],
];

export function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function SignupForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", accept: false });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const score = strength(f.password);
  const [label, fg, fill] = LEVELS[score];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (f.password !== f.confirm) return setError("Passwords don't match.");
    if (!f.accept) return setError("Accept the Terms of Service and Privacy Policy to continue.");
    setBusy(true);
    try {
      const r = await api<{ next: string }>("/api/auth/signup", { method: "POST", json: { name: f.name, email: f.email, password: f.password, acceptTerms: f.accept } });
      router.push(r.next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.02em]">Create your account</h1>
        <p className="m-0 text-muted">
          Already have one?{" "}
          <Link href="/login" className="font-semibold">
            Log in
          </Link>
        </p>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input id="name" autoComplete="name" required placeholder="Ada Lovelace" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label">
          Work or personal email
        </label>
        <input id="email" type="email" autoComplete="email" required placeholder="you@company.com" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pw" className="label">
          Password
        </label>
        <div className="flex h-[42px] items-center rounded-[9px] border border-field pr-1 pl-3 focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_var(--color-brand-50)]">
          <input
            id="pw"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 12 characters"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[7px] text-muted">
            <Icon name={show ? "eyeOff" : "eye"} />
          </button>
        </div>
        <div className="mt-1 grid grid-cols-4 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-[5px] rounded-full" style={{ background: i < score ? fill : "#E5E7EB" }} />
          ))}
        </div>
        <div className="flex justify-between gap-2 text-xs">
          <span className="font-semibold" style={{ color: f.password ? fg : "#586577" }}>
            Strength: {f.password ? label : "—"}
          </span>
          <span className="text-muted">12+ chars · upper · number · symbol</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pw2" className="label">
          Confirm password
        </label>
        <input
          id="pw2"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          className={cn("input", f.confirm && f.confirm !== f.password && "border-danger-500")}
          value={f.confirm}
          onChange={(e) => setF({ ...f, confirm: e.target.value })}
        />
      </div>
      <label className="flex items-start gap-2.5 text-[13px] leading-normal text-ink-3">
        <input type="checkbox" className="mt-[3px] accent-brand" checked={f.accept} onChange={(e) => setF({ ...f, accept: e.target.checked })} />
        <span>
          I agree to the <Link href="/#faq">Terms of Service</Link> and <Link href="/#faq">Privacy Policy</Link>.
        </span>
      </label>
      <button type="submit" disabled={busy} className="btn-primary h-[46px] rounded-[10px] text-[15px]">
        {busy && <Spinner />}Create account
      </button>
      <p className="m-0 text-center text-xs text-muted">We&apos;ll email you a 6-digit verification code.</p>
    </form>
  );
}
