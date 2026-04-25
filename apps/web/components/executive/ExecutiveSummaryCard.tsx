"use client";

import { Card } from "@/components/ui/Card";
import type { ExecutiveSummarySection } from "@/modules/executive-reporting/executive-report.types";

export function ExecutiveSummaryCard({ summary }: { summary: ExecutiveSummarySection }) {
  return (
    <Card variant="dashboardPanel" className="space-y-2">
      <h2 className="text-lg font-semibold text-[#0B0B0B]">{summary.headline}</h2>
      <p className="text-sm text-zinc-600">Period: {summary.periodLabel}</p>
      <p className="text-sm text-zinc-700">{summary.dataFreshnessNote}</p>
    </Card>
  );
}
