"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HostManualPaymentActions({
  bookingId,
  manualSettlement,
}: {
  bookingId: string;
  manualSettlement: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function post(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/bnhub/bookings/${encodeURIComponent(bookingId)}/manual-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (manualSettlement === "PENDING") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => post("received")}
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading === "received" ? "Saving…" : "Mark payment received"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => post("failed")}
          className="rounded-xl border border-amber-500/50 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
        >
          {loading === "failed" ? "Saving…" : "Mark payment failed"}
        </button>
      </div>
    );
  }

  if (manualSettlement === "FAILED") {
    return (
      <div className="mt-4">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => post("reset_pending")}
          className="rounded-xl border border-sky-500/50 px-4 py-2.5 text-sm font-medium text-sky-200 hover:bg-sky-500/10 disabled:opacity-50"
        >
          {loading === "reset_pending" ? "Saving…" : "Reset to payment pending"}
        </button>
      </div>
    );
  }

  return null;
}
