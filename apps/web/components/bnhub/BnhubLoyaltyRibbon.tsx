"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type LoyaltyPayload = {
  ok: boolean;
  tier?: string;
  label?: string;
  completedBookings?: number;
  discountPercent?: number;
};

/**
 * Compact Prestige loyalty strip for signed-in guests on BNHUB surfaces.
 */
export function BnhubLoyaltyRibbon() {
  const [data, setData] = useState<LoyaltyPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bnhub/loyalty/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: LoyaltyPayload) => {
        if (!cancelled && j?.ok) setData(j);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data?.tier || data.tier === "NONE") return null;

  return (
    <Link
      href="/bnhub/trips"
      className="hidden max-w-[14rem] truncate rounded-full border border-premium-gold/35 bg-premium-gold/10 px-3 py-1.5 text-left text-xs font-semibold text-premium-gold transition hover:border-premium-gold/60 hover:bg-premium-gold/15 lg:inline-flex lg:items-center lg:gap-1.5"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{data.label ?? data.tier}</span>
      {typeof data.discountPercent === "number" && data.discountPercent > 0 ? (
        <span className="shrink-0 text-[10px] text-premium-gold/80">· up to {data.discountPercent}%</span>
      ) : null}
    </Link>
  );
}
