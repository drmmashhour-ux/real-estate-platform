"use client";

import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

export function InvestorMarketInsightCard(props: {
  kpis: {
    totalListings: number;
    activeListings: number;
    totalUsers: number;
    totalTransactions: number;
    totalRevenueCents: number;
  };
  demoMode: boolean;
}) {
  const ctx = {
    ...props.kpis,
    demoMode: props.demoMode,
    periodNote: "Last 30 days investor dashboard view",
  };

  return (
    <div className="mt-8 rounded-2xl border border-premium-gold/25 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-premium-gold">Market & platform insight</h2>
      <p className="mt-1 text-xs text-slate-500">Interprets the KPI row and charts — estimates only.</p>
      <div className="mt-4">
        <HubAiInsightWidget
          hub="investor"
          feature="chart_explain"
          intent="explain"
          title="Explain this view"
          context={ctx}
          accent="var(--color-premium-gold)"
        />
      </div>
    </div>
  );
}
