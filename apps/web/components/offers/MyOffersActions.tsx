"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { OfferStatus } from "@prisma/client";

type Props = {
  offerId: string;
  status: OfferStatus;
};

const WITHDRAWABLE: OfferStatus[] = ["SUBMITTED", "UNDER_REVIEW", "COUNTERED"];

export function MyOffersActions({ offerId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canWithdraw = WITHDRAWABLE.includes(status);

  async function withdraw() {
    if (!canWithdraw || busy) return;
    if (!window.confirm("Withdraw this offer? You can submit a new one later.")) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(offerId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not withdraw");
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {err ? <span className="max-w-[200px] text-right text-[10px] text-red-300">{err}</span> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/dashboard/offers/${offerId}`}
          className="rounded-lg bg-[#C9A96E]/90 px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#C9A96E]"
        >
          View
        </Link>
        {canWithdraw ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void withdraw()}
            className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-950/40 disabled:opacity-50"
          >
            {busy ? "…" : "Withdraw"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
