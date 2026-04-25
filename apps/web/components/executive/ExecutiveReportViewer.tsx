"use client";

import type { ExecutiveReportView } from "@/modules/executive-reporting/executive-report.types";
import { AutonomySectionView } from "./AutonomySectionView";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { InvestorSectionView } from "./InvestorSectionView";
import { KpiSectionView } from "./KpiSectionView";
import { PortfolioSectionView } from "./PortfolioSectionView";
import { StrategySectionView } from "./StrategySectionView";
import { Card } from "@/components/ui/Card";

export function ExecutiveReportViewer({
  report,
  reportId,
}: {
  report: ExecutiveReportView;
  reportId?: string;
}) {
  const pdfHref = reportId ? `/api/executive/report/pdf?id=${encodeURIComponent(reportId)}` : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#0B0B0B]">Executive report</h1>
        {pdfHref ?
          <a
            href={pdfHref}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Download PDF
          </a>
        : null}
      </div>

      <ExecutiveSummaryCard summary={report.summary} />
      <KpiSectionView kpi={report.kpi} />
      <StrategySectionView strategy={report.strategy} />
      <PortfolioSectionView portfolio={report.portfolio} />
      <InvestorSectionView investor={report.investor} />
      <AutonomySectionView autonomy={report.autonomy} />

      <Card variant="dashboardPanel" className="space-y-2">
        <h3 className="text-base font-semibold text-[#0B0B0B]">Narrative</h3>
        <p className="text-sm text-zinc-800">{report.narrative.summaryText}</p>
        <div>
          <h4 className="text-sm font-medium text-zinc-800">Key insights</h4>
          <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
            {report.narrative.keyInsights.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-zinc-800">Risks / opportunities</h4>
          <p className="text-xs font-medium text-zinc-600">Risks</p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
            {report.narrative.topRisks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs font-medium text-zinc-600">Opportunities</p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
            {report.narrative.topOpportunities.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-zinc-800">Recommended actions</h4>
          <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
            {report.narrative.recommendedActions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </Card>

      <Card variant="dashboardPanel" className="space-y-2">
        <h3 className="text-base font-semibold text-[#0B0B0B]">System recommendations</h3>
        <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {report.recommendations.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
