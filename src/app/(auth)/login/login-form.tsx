"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { api, ErrorNote, Spinner } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api<{ next: string }>("/api/auth/login", { method: "POST", json: { email, password } });
      router.push(r.next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.02em]">Welcome back</h1>
        <p className="m-0 text-muted">
          New to DevVault?{" "}
          <Link href="/signup" className="font-semibold">
            Create an account
          </Link>
        </p>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" type="email" autoComplete="email" required placeholder="you@company.com" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pw" className="label">
          Password
        </label>
        <div className="flex h-[42px] items-center rounded-[9px] border border-field pr-1 pl-3 focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_var(--color-brand-50)]">
          <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" required className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[7px] text-muted">
            <Icon name={show ? "eyeOff" : "eye"} />
          </button>
        </div>
      </div>
      <button type="submit" disabled={busy} className="btn-primary h-[46px] rounded-[10px] text-[15px]">
        {busy && <Spinner />}Log in
      </button>
      <p className="m-0 text-center text-xs text-muted">You&apos;ll confirm with your authenticator app next.</p>
    </form>
  );
}
