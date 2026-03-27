"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LandlordMarkPaidButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    try {
      const r = await fetch(`/api/rental/payments/${paymentId}/mark-paid`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!r.ok) {
        const j = (await r.json()) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={mark}
      className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
    >
      {busy ? "…" : "Mark paid"}
    </button>
  );
}
