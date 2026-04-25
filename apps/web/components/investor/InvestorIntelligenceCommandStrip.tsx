"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { InvestmentOpportunity, MarketExpansionCandidate, InvestmentRisk, InvestorAlert } from "@/modules/investor-intelligence/investor-intelligence.types";

type Payload = {
  ok?: boolean;
  snapshot?: { topSegmentJson?: unknown; totalRevenue: number; estimatedPipelineValue?: number | null };
  expansion?: { topMarkets: MarketExpansionCandidate[]; topSegments: InvestmentOpportunity[]; risks: InvestmentRisk[]; capacityNotes: string[] };
  alerts?: InvestorAlert[];
  featureDisabled?: boolean;
};

/**
 * High-level link-out for the command center — optional fetch; no heavy layout.
 */
export function InvestorIntelligenceCommandStrip() {
  const [p, setP] = useState<Payload | null>(null);
  const load = useCallback(() => {
    void fetch("/api/investor/overview", { credentials: "include" })
      .then((r) => r.json() as Promise<Payload>)
      .then((j) => {
        if (j.ok) setP(j);
      })
      .catch(() => setP({ ok: false }));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!p || p.featureDisabled) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]/80">Investor intelligence</p>
        <p className="mt-1 text-xs text-neutral-500">Enable <code className="text-[10px]">FEATURE_INVESTOR_INTELLIGENCE_V1</code> to surface top ROI and risks.</p>
        <Link href="/dashboard/investor-intelligence" className="mt-1 inline-block text-xs text-[#D4AF37] hover:underline">
          Open dashboard (broker/admin) →
        </Link>
      </div>
    );
  }
  if (!p.snapshot) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
        <Link href="/dashboard/investor-intelligence" className="text-xs text-[#D4AF37] hover:underline">
          Investor intelligence dashboard →
        </Link>
      </div>
    );
  }
  const topM = p.expansion?.topMarkets?.[0];
  const seg = p.expansion?.topSegments?.[0];
  const alert0 = p.alerts?.[0];
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-[#f4efe4]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]/80">Investor intelligence (sample)</p>
      <p className="mt-1 text-xs text-neutral-300">
        Top market: {topM ? `${topM.marketKey} (${topM.wonDeals} won)` : "n/a"}. Top segment: {seg ? seg.scopeKey.slice(0, 32) : "n/a"}. Alert:{" "}
        {alert0 ? alert0.message.slice(0, 120) : "none"}. <span className="text-neutral-500">(Not financial advice; internal only.)</span>
      </p>
      <Link href="/dashboard/investor-intelligence" className="mt-1 inline-block text-xs text-[#D4AF37] hover:underline">
        Open full view →
      </Link>
    </div>
  );
}
