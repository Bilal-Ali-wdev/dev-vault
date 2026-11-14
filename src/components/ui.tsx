"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icons";
import { cn } from "@/lib/format";

/** JSON fetch helper for the app's API. Throws an Error carrying `code` and `status`. */
export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & { code?: string; status?: number };
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export function Modal({ open, onClose, title, children, footer, width = 520 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; width?: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[90vh] w-[calc(100%-32px)] rounded-2xl border border-line bg-white p-0 text-ink shadow-[0_24px_60px_rgba(15,23,42,.2)] backdrop:bg-[rgba(15,23,42,.35)]"
      style={{ maxWidth: width }}
    >
      {open && (
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex items-center gap-2.5 border-b border-line-soft px-[22px] py-4">
            <h2 className="m-0 flex-1 text-[17px] font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-chip text-ink-2">
              <Icon name="x" size={14} strokeWidth={2.4} />
            </button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-[22px] py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2.5 border-t border-line-soft px-[22px] py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,23,42,.35)]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex h-full w-[460px] max-w-full flex-col bg-white shadow-[-20px_0_40px_rgba(15,23,42,.15)]">
        <div className="flex items-center gap-2.5 border-b border-line-soft px-[22px] py-[18px]">
          <h2 className="m-0 flex-1 text-[17px] font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-chip text-ink-2">
            <Icon name="x" size={14} strokeWidth={2.4} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 border-t border-line-soft px-[22px] py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function ErrorNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-[9px] bg-danger-50 px-3 py-2.5 text-[13px] text-danger">
      <Icon name="alert" size={15} className="mt-px" />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ size = 14 }: { size?: number }) {
  return <span aria-hidden="true" className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent" style={{ width: size, height: size }} />;
}

export function Dot({ color, size = 10, radius = 3 }: { color: string; size?: number; radius?: number }) {
  return <span aria-hidden="true" style={{ width: size, height: size, borderRadius: radius, background: color, flex: "none", display: "inline-block" }} />;
}

/** 6-box numeric code input (paste-aware). */
export function CodeInput({ value, onChange, autoFocus, label = "Digit" }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; label?: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
  const firstEmpty = digits.findIndex((d) => !d);
  const set = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = (value.slice(0, i) + clean).slice(0, 6);
      onChange(next);
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const arr = digits.slice();
    arr[i] = clean;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="flex items-center gap-2">
      {digits.map((d, i) => (
        <span key={i} className="contents">
          {i === 3 && <span aria-hidden="true" className="h-0.5 w-2.5 bg-[#CBD2DA]" />}
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-label={`${label} ${i + 1}`}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && i === 0}
            value={d}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            onPaste={(e) => {
              e.preventDefault();
              set(i, e.clipboardData.getData("text"));
            }}
            className={cn(
              "h-[58px] w-[52px] min-w-0 rounded-[10px] text-center font-mono text-2xl font-semibold text-ink outline-none max-[420px]:h-12 max-[420px]:w-10",
              i === firstEmpty ? "border-2 border-brand-500 shadow-[0_0_0_3px_var(--color-brand-50)]" : d ? "border border-brand-500" : "border border-field"
            )}
          />
        </span>
      ))}
    </div>
  );
}
