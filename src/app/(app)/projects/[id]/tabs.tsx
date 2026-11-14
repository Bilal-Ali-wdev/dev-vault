"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const TABS = [
  ["Overview", ""],
  ["Tasks", "/tasks"],
  ["Sessions", "/sessions"],
  ["AI Assistant", "/assistant"],
  ["GitHub", "/github"],
  ["Services", "/services"],
  ["Vault", "/vault"],
  ["Docs", "/docs"],
  ["Settings", "/settings"],
] as const;

export function ProjectTabs({ id }: { id: string }) {
  const path = usePathname();
  const base = `/projects/${id}`;
  return (
    <nav aria-label="Project sections" className="-mb-px flex gap-0.5 overflow-x-auto">
      {TABS.map(([label, sub]) => {
        const href = base + sub;
        const on = sub ? path.startsWith(href) : path === base;
        return (
          <Link
            key={label}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn("inline-flex h-[38px] items-center border-b-2 px-3 text-[13px] whitespace-nowrap", on ? "border-brand-500 font-semibold text-brand" : "border-transparent font-medium text-ink-3 hover:text-ink")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
