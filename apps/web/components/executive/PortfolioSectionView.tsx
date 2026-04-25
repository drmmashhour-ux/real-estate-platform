"use client";

import { Card } from "@/components/ui/Card";
import type { PortfolioSection } from "@/modules/executive-reporting/executive-report.types";

export function PortfolioSectionView({ portfolio }: { portfolio: PortfolioSection }) {
  return (
    <Card variant="dashboardPanel" className="space-y-4">
      <h3 className="text-base font-semibold text-[#0B0B0B]">Portfolio</h3>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">Higher-risk deals (snapshot)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {portfolio.highRiskDeals.map((d) => (
            <li key={d.dealId}>
              {d.title} — {d.pipelineStage} — {d.underwritingRecommendation ?? d.underwritingLabel ?? "n/a"}
              {d.brokerName ? ` — owner ${d.brokerName}` : ""}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">Higher-opportunity deals (snapshot)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {portfolio.highOpportunityDeals.map((d) => (
            <li key={d.dealId}>
              {d.title} — {d.pipelineStage} — {d.underwritingRecommendation ?? d.underwritingLabel ?? "n/a"}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">Active deals by owner (top)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {portfolio.brokerHighlights.map((b) => (
            <li key={b.brokerName}>
              {b.brokerName}: {b.activeDealCount} active
            </li>
          ))}
        </ul>
      </div>
      {portfolio.assumptions.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600">
          {portfolio.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
