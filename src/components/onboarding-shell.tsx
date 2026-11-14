import Link from "next/link";
import { Icon } from "./icons";
import { Logo } from "./logo";
import { cn } from "@/lib/format";

const STEPS = [
  ["Create account", "Name, email and a strong password"],
  ["Verify email", "6-digit code sent to your inbox"],
  ["Connect a database", "Optional — Supabase, MongoDB or Postgres"],
  ["Set up authenticator", "TOTP app plus recovery codes"],
];

/** Split layout used by sign-up, login and onboarding steps. `current` = -1 shows the steps without progress. */
export function OnboardingShell({ current, children, maxWidth = 420 }: { current: number; children: React.ReactNode; maxWidth?: number }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-white text-sm text-ink">
      <aside className="flex flex-[1_1_420px] flex-col gap-10 bg-night px-12 py-10 text-[#E2E8F0] max-sm:px-6">
        <Link href="/" className="self-start" aria-label="DevVault home">
          <Logo variant="light" height={36} />
        </Link>
        <div className="flex max-w-[420px] flex-col gap-3.5">
          <h2 className="m-0 text-[32px] leading-[1.15] font-extrabold tracking-[-0.025em] text-white">Your projects, remembered.</h2>
          <p className="m-0 text-[15px] leading-relaxed text-night-text">Four quick steps and your workspace is ready. Every account is protected with authenticator-based MFA.</p>
        </div>
        <ol className="m-0 flex max-w-[420px] list-none flex-col gap-1.5 p-0">
          {STEPS.map(([t, d], i) => {
            const done = current >= 0 && i < current;
            const cur = i === current;
            return (
              <li key={t} aria-current={cur ? "step" : undefined} className={cn("flex items-start gap-3.5 rounded-xl border px-3.5 py-3", cur ? "border-night-line bg-night-2" : "border-transparent")}>
                <span
                  className={cn(
                    "flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold",
                    done ? "bg-success-500 text-white" : cur ? "bg-brand-500 text-white" : "border-[1.5px] border-[#3A5158] text-night-text"
                  )}
                >
                  {done ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className={cn("text-sm font-semibold", done ? "text-night-text" : "text-white")}>{t}</span>
                  <span className="text-[13px] text-night-text">{d}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto flex items-center gap-2.5 text-[13px] text-night-text">
          <Icon name="shield" size={16} className="text-[#6FD3C3]" />
          Secrets are encrypted with AES-256-GCM and never sent to AI.
        </div>
      </aside>
      <main className="flex flex-[999_1_520px] items-center justify-center px-6 py-12">
        <div className="flex w-full flex-col" style={{ maxWidth }}>
          {children}
        </div>
      </main>
    </div>
  );
}
