"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listingId: string;
  bookingId: string;
  disabled?: boolean;
  existingContractId?: string | null;
};

export function GenerateLeaseButton({ listingId, bookingId, disabled, existingContractId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    if (existingContractId) {
      router.push(`/contracts/${existingContractId}`);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/contracts/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, bookingId }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Could not generate lease");
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
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Lease agreement</p>
      <p className="mt-1 text-sm text-slate-400">
        Generate a residential lease for this stay (Québec-style template). All parties sign electronically.
      </p>
      {err ? <p className="mt-2 text-sm text-rose-400">{err}</p> : null}
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={disabled || loading}
        className="mt-3 inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-[#0B0B0B] disabled:opacity-50 sm:w-auto"
        style={{ background: "#C9A646" }}
      >
        {loading ? "Working…" : existingContractId ? "View lease contract" : "Generate lease"}
      </button>
    </div>
  );
}
