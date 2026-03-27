"use client";

import { useEffect, useState } from "react";
import { StrategyModeSelector } from "@/components/deal/StrategyModeSelector";
import { OfferStrategyCard } from "@/components/deal/OfferStrategyCard";
import { MortgageAffordabilityCard } from "@/components/deal/MortgageAffordabilityCard";
import { WatchlistButton } from "@/components/deal/WatchlistButton";
import { OfferStrategySimulator } from "@/src/modules/offer-strategy-simulator/ui/OfferStrategySimulator";

const STORAGE_PREFIX = "deal-analyzer-strategy-";

type Flags = {
  offer: boolean;
  mortgage: boolean;
  alerts: boolean;
  strategyModes: boolean;
};

export function DealAnalyzerPhase3BuyerPanel({
  listingId,
  priceCents,
  flags,
}: {
  listingId: string;
  priceCents: number;
  flags: Flags;
}) {
  const [mode, setMode] = useState("buy_to_live");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${listingId}`);
      if (raw && typeof raw === "string") setMode(raw);
    } catch {
      /* ignore */
    }
  }, [listingId]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${listingId}`, mode);
    } catch {
      /* ignore */
    }
  }, [listingId, mode]);

  const any = flags.offer || flags.mortgage || flags.alerts || flags.strategyModes;
  if (!any) return null;

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Deal Analyzer — Phase 3</p>
        <p className="mt-1 text-xs text-slate-500">
          Planning tools and illustrations — not approvals, guarantees, or legal advice.
        </p>
      </div>
      {flags.strategyModes ? <StrategyModeSelector enabled value={mode} onChange={setMode} /> : null}
      {flags.offer ? <OfferStrategyCard listingId={listingId} enabled strategyMode={mode} /> : null}
      {flags.offer ? <OfferStrategySimulator propertyId={listingId} listPriceCents={priceCents} /> : null}
      {flags.mortgage ? <MortgageAffordabilityCard listingId={listingId} priceCents={priceCents} enabled /> : null}
      {flags.alerts ? <WatchlistButton listingId={listingId} enabled /> : null}
    </div>
  );
}
