"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GuaranteeClaimButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function claim() {
    if (!window.confirm("Start a BNHUB guarantee claim? Our team will review your case.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/bnhub/bookings/${bookingId}/guarantee/claim`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Claim failed");
      setMessage("Claim submitted. Support will follow up.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not submit claim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
      <p className="text-sm font-medium text-emerald-200">BNHUB guarantee</p>
      <p className="mt-1 text-xs text-slate-400">
        If the stay does not match what was advertised, you can open a guarantee claim after check-in issues are
        documented.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void claim()}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Claim guarantee"}
      </button>
      {message ? <p className="mt-2 text-xs text-slate-300">{message}</p> : null}
    </div>
  );
}
