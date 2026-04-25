"use client";

import { Card } from "@/components/ui/Card";
import type { InvestorSection } from "@/modules/executive-reporting/executive-report.types";

export function InvestorSectionView({ investor }: { investor: InvestorSection }) {
  return (
    <Card variant="dashboardPanel" className="space-y-3">
      <h3 className="text-base font-semibold text-[#0B0B0B]">Investor intelligence</h3>
      <p className="text-sm text-zinc-700">
        Opportunities in period: {investor.opportunityCountInPeriod.value ?? "n/a"} — mean expectedROI field:{" "}
        {investor.meanExpectedRoiPercent.value == null ? "n/a" : `${investor.meanExpectedRoiPercent.value}%`}
      </p>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">Risk tags (counts)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {Object.entries(investor.riskLevelCounts).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
        </ul>
      </div>
      <div className="text-sm text-zinc-700">
        <p>
          Capital stack rows (active deals): {investor.capitalStackTotals.dealsWithStack} — totalCapitalRequired sum:{" "}
          {investor.capitalStackTotals.totalCapitalRequiredSum == null ?
            "n/a"
          : investor.capitalStackTotals.totalCapitalRequiredSum.toFixed(2)}
        </p>
        <p className="text-xs text-zinc-500">{investor.capitalStackTotals.trace.description}</p>
      </div>
      {investor.expansionNotes.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {investor.expansionNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {investor.assumptions.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600">
          {investor.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
