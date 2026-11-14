"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icons";
import { Logo, LogoMark } from "./logo";
import { api, Dot, Spinner } from "./ui";
import { EndSessionModal } from "./session-modals";
import { cn, duration } from "@/lib/format";

type Nav = {
  user: { name: string; email: string };
  projects: { id: string; name: string; color: string }[];
  openTasks: number;
  active: { id: string; projectId: string; projectName: string; color: string; startedAt: string } | null;
};

const FREE_LIMIT = 5;

function NavLink({ href, icon, label, active, badge, onClick }: { href: string; icon: IconName; label: string; active: boolean; badge?: number; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn("flex h-[34px] items-center gap-2.5 rounded-lg px-2.5", active ? "bg-brand-50 font-semibold text-brand hover:text-brand" : "text-ink-2 hover:bg-canvas hover:text-ink")}
    >
      <Icon name={icon} />
      <span className="flex-1">{label}</span>
      {badge ? <span className="text-xs font-normal text-muted">{badge}</span> : null}
    </Link>
  );
}

function SessionCard({ active }: { active: NonNullable<Nav["active"]> }) {
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-brand-500/40 bg-brand-25 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        Session running · {duration(now - new Date(active.startedAt).getTime())}
      </div>
      <Link href={`/projects/${active.projectId}/sessions`} className="flex items-center gap-2 truncate text-[13px] font-medium text-ink">
        <Dot color={active.color} />
        <span className="truncate">{active.projectName}</span>
      </Link>
      <button type="button" onClick={() => setEnding(true)} className="btn-secondary h-8 text-xs font-semibold">
        <Icon name="stop" size={12} />
        End &amp; log session
      </button>
      <EndSessionModal open={ending} onClose={() => setEnding(false)} projectId={active.projectId} sessionId={active.id} />
    </div>
  );
}

export function Sidebar({ nav }: { nav: Nav }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const close = () => setOpen(false);
  const activeProject = path.match(/^\/projects\/([a-f0-9]{24})/)?.[1];
  const used = nav.projects.length;

  async function logout() {
    setLeaving(true);
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const body = (
    <>
      <div className="flex items-center gap-2.5 px-1.5 py-1">
        <LogoMark size={34} label={null} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] font-bold tracking-[-0.01em]">DevVault</span>
          <span className="truncate text-xs text-muted">{nav.user.name}&apos;s workspace</span>
        </div>
        <button type="button" onClick={close} aria-label="Close menu" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted md:hidden">
          <Icon name="x" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <NavLink href="/dashboard" icon="home" label="Home" active={path === "/dashboard"} onClick={close} />
        <NavLink href="/tasks" icon="checkbox" label="My tasks" active={path === "/tasks"} badge={nav.openTasks} onClick={close} />
        <NavLink href="/assistant" icon="sparkles" label="AI assistant" active={path.endsWith("/assistant")} onClick={close} />
        <NavLink href="/vault" icon="padlock" label="Environment vault" active={path.endsWith("/vault")} onClick={close} />
      </div>

      <div className="flex min-h-0 flex-col gap-0.5">
        <div className="flex items-center justify-between px-2.5 pb-1.5">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">Projects</span>
          <Link href="/projects/new" onClick={close} aria-label="New project" className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-canvas">
            <Icon name="plus" size={15} />
          </Link>
        </div>
        {nav.projects.length === 0 && (
          <Link href="/projects/new" onClick={close} className="rounded-lg border border-dashed border-[#CBD2DA] px-2.5 py-2 text-[13px] text-ink-3">
            Create your first project
          </Link>
        )}
        <div className="flex flex-col gap-0.5 overflow-y-auto">
          {nav.projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              onClick={close}
              className={cn("flex h-8 flex-none items-center gap-2.5 rounded-lg px-2.5", activeProject === p.id ? "bg-brand-50 font-semibold text-brand hover:text-brand" : "text-ink-2 hover:bg-canvas hover:text-ink")}
            >
              <Dot color={p.color} />
              <span className="flex-1 truncate">{p.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        {nav.active && <SessionCard active={nav.active} />}
        <div className="flex flex-col gap-2 rounded-[10px] border border-line p-3">
          <div className="flex justify-between text-xs">
            <span className="font-semibold">Free plan</span>
            <span className="text-muted">
              {used} / {FREE_LIMIT} projects
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-line-soft">
            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (used / FREE_LIMIT) * 100)}%` }} />
          </div>
          <Link href="/#pricing" className="text-xs font-semibold">
            Upgrade to Pro
          </Link>
        </div>
        <NavLink href="/settings" icon="settings" label="Settings" active={path === "/settings"} onClick={close} />
        <button type="button" onClick={logout} className="flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-ink-3 hover:bg-canvas">
          {leaving ? <Spinner /> : <Icon name="logout" />}
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-line bg-white px-4 md:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-2">
          <Icon name="menu" />
        </button>
        <Logo height={28} />
      </div>
      {open && <div className="fixed inset-0 z-40 bg-[rgba(15,23,42,.35)] md:hidden" onClick={close} />}
      <nav
        aria-label="Main"
        className={cn(
          "flex w-[248px] flex-none flex-col gap-[18px] border-r border-line bg-white px-3 py-3.5",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl max-md:transition-transform",
          open ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "md:sticky md:top-0 md:h-screen"
        )}
      >
        {body}
      </nav>
    </>
  );
}
