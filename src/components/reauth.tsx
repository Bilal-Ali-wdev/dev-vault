"use client";

import { useCallback, useRef, useState } from "react";
import { api, CodeInput, ErrorNote, Modal, Spinner } from "./ui";

/**
 * Wraps sensitive calls: if the API answers `mfa_required`, asks for an authenticator code,
 * refreshes the session's MFA timestamp, then retries once.
 */
export function useReauth() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{ resolve: () => void; reject: (e: Error) => void } | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if ((e as { code?: string }).code !== "mfa_required") throw e;
      await new Promise<void>((resolve, reject) => {
        pending.current = { resolve, reject };
        setCode("");
        setError("");
        setOpen(true);
      });
      return fn();
    }
  }, []);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/mfa/challenge", { method: "POST", json: { code } });
      setOpen(false);
      pending.current?.resolve();
      pending.current = null;
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  function cancel() {
    setOpen(false);
    pending.current?.reject(new Error("cancelled"));
    pending.current = null;
  }

  const dialog = (
    <Modal
      open={open}
      onClose={cancel}
      title="Confirm with your authenticator"
      width={440}
      footer={
        <>
          <button type="button" onClick={cancel} className="btn-secondary h-10 px-4 font-semibold text-ink">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy || code.replace(/\D/g, "").length !== 6} className="btn-primary h-10 px-[18px]">
            {busy && <Spinner />}Confirm
          </button>
        </>
      }
    >
      <p className="m-0 text-[13px] leading-normal text-muted">Revealing, copying and exporting secrets needs a fresh MFA check. It stays valid for 15 minutes.</p>
      <CodeInput value={code} onChange={setCode} autoFocus />
      <ErrorNote>{error}</ErrorNote>
    </Modal>
  );

  return { run, dialog };
}
