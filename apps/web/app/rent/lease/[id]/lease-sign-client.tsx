"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LegalAiDisclaimer } from "@/components/legal/LegalAiDisclaimer";

export function LeaseSignClient({
  leaseId,
  contractText,
}: {
  leaseId: string;
  contractText: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sign() {
    if (!accepted) {
      setErr("You must accept terms before continuing.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const legalAcceptedAt = new Date().toISOString();
      const r = await fetch(`/api/rental/leases/${leaseId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ legalAcceptedAt }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Could not sign");
      router.push("/dashboard/tenant/payments");
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setErr(
        m === "Sign in required" || m.includes("401")
          ? "Sign in to sign the lease."
          : m && m !== "sign_failed" && m.length < 160
            ? m
            : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Lease draft</p>
        <pre className="mt-4 max-h-[360px] overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-[#B3B3B3]">
          {contractText}
        </pre>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#C9A646] hover:underline"
          onClick={() => setOpen(true)}
        >
          Open full contract view
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/85 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-6">
            <h2 className="text-lg font-semibold text-white">Residential lease</h2>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-[#B3B3B3]">{contractText}</pre>
            <button
              type="button"
              className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/90">
        <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>I have read this lease draft and agree to sign electronically. I understand this is a demo workflow and
          independent legal review is recommended.</span>
      </label>

      <LegalAiDisclaimer />

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={sign}
        className="w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {busy ? "Signing…" : "Accept & sign lease"}
      </button>
    </div>
  );
}
