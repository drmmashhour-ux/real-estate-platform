"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listingId: string;
  offerType?: "purchase_offer" | "rental_offer";
};

export function GenerateOfferButton({ listingId, offerType = "purchase_offer" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/offers/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: offerType,
          listingId,
          payload: { listingId },
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Could not generate offer");
        return;
      }
      router.push(`/contracts/${j.contractId}`);
    } catch {
      setErr("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-500/25 bg-[#0B0B0B]/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Offer document</p>
      <p className="mt-1 text-sm text-slate-400">
        Generate a draft offer (template). Review before sending — not legal advice.
      </p>
      {err ? <p className="mt-2 text-sm text-rose-400">{err}</p> : null}
      <button
        type="button"
        onClick={() => void go()}
        disabled={loading}
        className="mt-3 inline-flex rounded-xl px-4 py-2.5 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
        style={{ background: "#C9A646" }}
      >
        {loading ? "Generating…" : "Generate offer"}
      </button>
    </div>
  );
}
