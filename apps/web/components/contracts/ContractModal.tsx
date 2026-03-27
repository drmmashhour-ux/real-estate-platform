"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  open: boolean;
  contractId: string | null;
  onClose: () => void;
  /** Called after successful sign */
  onSigned?: () => void;
};

/**
 * Modal shell for reviewing and signing a pending marketplace-style contract (checkbox + confirm).
 * Loads `/api/contracts/[id]` and submits to `/api/marketplace/seller-contracts/sign`.
 */
export function ContractModal({ open, contractId, onClose, onSigned }: Props) {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [canSign, setCanSign] = useState(false);

  const load = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, { credentials: "same-origin" });
      const j = await res.json();
      if (!res.ok) {
        setLoadError(j.error || "Failed to load contract");
        setContentHtml(null);
        return;
      }
      setTitle(typeof j.title === "string" ? j.title : "Agreement");
      setContentHtml(typeof j.contentHtml === "string" ? j.contentHtml : null);
      setCanSign(Boolean(j.canSign && j.marketplaceSimpleSign));
    } catch {
      setLoadError("Network error");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (open && contractId) {
      setAgree(false);
      setSubmitError(null);
      void load();
    }
  }, [open, contractId, load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contractId || !agree) {
      setSubmitError("Please confirm you agree.");
      return;
    }
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/seller-contracts/sign", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, confirm: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(typeof j.error === "string" ? j.error : "Could not sign");
        return;
      }
      onSigned?.();
      onClose();
    } catch {
      setSubmitError("Sign request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contract-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 id="contract-modal-title" className="text-lg font-semibold text-slate-100">
            {title || "Agreement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && !contentHtml ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : loadError ? (
            <p className="text-sm text-rose-400">{loadError}</p>
          ) : (
            <div
              className="prose prose-invert max-w-none prose-headings:text-amber-200 prose-p:text-slate-300 prose-li:text-slate-300"
              dangerouslySetInnerHTML={{ __html: contentHtml ?? "<p>No content.</p>" }}
            />
          )}
        </div>

        {canSign ? (
          <form onSubmit={onSubmit} className="border-t border-slate-800 px-5 py-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600"
              />
              <span>I have read and agree to this agreement.</span>
            </label>
            {submitError ? <p className="mt-2 text-sm text-rose-400">{submitError}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || !agree}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {loading ? "Signing…" : "Sign contract"}
              </button>
              <Link
                href={contractId ? `/contracts/${contractId}` : "#"}
                className="self-center text-sm text-amber-400/90 hover:text-amber-300"
              >
                Full page
              </Link>
            </div>
          </form>
        ) : (
          <div className="border-t border-slate-800 px-5 py-4">
            <p className="text-sm text-slate-500">
              {loadError ? null : "This agreement cannot be signed here. Open the full contract page."}
            </p>
            {contractId ? (
              <Link
                href={`/contracts/${contractId}`}
                className="mt-2 inline-block text-sm font-medium text-amber-400 hover:text-amber-300"
              >
                Open contract →
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
