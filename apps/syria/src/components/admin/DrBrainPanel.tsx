import type { DrBrainReport } from "@repo/drbrain";
import type { DrBrainExplanation } from "@/lib/drbrain/explanations";
import type { PredictiveSignal } from "@/lib/drbrain/predictive";
import type { DrBrainMetrics } from "@/lib/drbrain/metrics";
import type { DRBRAIN_INVESTOR_DEMO_KPIS } from "@/lib/drbrain/demo-data";
import type { DrBrainTicket } from "@repo/drbrain";
import { DrBrainCharts } from "@/components/admin/DrBrainCharts";
import type { DrBrainChartsLabels } from "@/components/admin/DrBrainCharts";
import { DrBrainMaintenanceActions } from "@/components/admin/DrBrainMaintenanceActions";
import { DrBrainTicketsPanel } from "@/components/admin/DrBrainTicketsPanel";
import { DrBrainDay1Checklist } from "@/components/admin/DrBrainDay1Checklist";
import { DrBrainInvestorDemoCharts } from "@/components/admin/drbrain/DrBrainInvestorDemoCharts";
import { DrBrainInvestorStory } from "@/components/admin/drbrain/DrBrainInvestorStory";

export type DrBrainSectionLabels = {
  issuesTitle: string;
  recommendationsTitle: string;
  maintenanceTitle: string;
  aiSectionTitle: string;
  predictiveSectionTitle: string;
  predictiveLead: string;
  summaryLabel: string;
  causesLabel: string;
  impactLabel: string;
  recommendedActionsLabel: string;
};

export type DrBrainExtendedLabels = DrBrainSectionLabels & {
  investorDemoRibbon: string;
  ticketUi: {
    sectionTitle: string;
    ack: string;
    resolve: string;
    ignore: string;
    recommendedSummary: string;
    working: string;
    demoNotice: string;
    empty: string;
  };
  checklistTitle: string;
  checklistItems: Record<
    | "preflight"
    | "webhook"
    | "escrow"
    | "killSwitch"
    | "noCriticalTickets"
    | "dbHealthy"
    | "buildVersion",
    string
  >;
  storyUi: {
    title: string;
    runDemo: string;
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    s5: string;
    s6: string;
    demoHint: string;
  };
};

function deriveIssues(report: DrBrainReport): string[] {
  const lines: string[] = [];
  for (const r of report.results) {
    if (!r.ok || r.level === "WARNING" || r.level === "CRITICAL") {
      lines.push(`${r.check}: ${r.message}`);
    }
  }
  return lines.slice(0, 24);
}

export function DrBrainPanel(props: {
  title: string;
  report: DrBrainReport;
  metrics: DrBrainMetrics;
  explanation: DrBrainExplanation;
  predictive: PredictiveSignal[];
  chartLabels: DrBrainChartsLabels;
  sectionLabels: DrBrainExtendedLabels;
  investorDemo: boolean;
  demoKpis?: typeof DRBRAIN_INVESTOR_DEMO_KPIS;
  tickets: DrBrainTicket[];
}) {
  const {
    title,
    report,
    metrics,
    explanation,
    predictive,
    chartLabels,
    sectionLabels,
    investorDemo,
    demoKpis,
    tickets,
  } = props;
  const issues = deriveIssues(report);

  const statusBanner =
    report.status === "CRITICAL"
      ? "border-red-200 bg-red-50 text-red-950"
      : report.status === "WARNING"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-emerald-200 bg-emerald-50 text-emerald-950";

  const kpis = demoKpis;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          Environment <span className="font-medium">{report.appEnv}</span> ·{" "}
          <span className="text-xs text-stone-500">{report.timestamp}</span>
        </p>
      </div>

      {investorDemo ? (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">
          {sectionLabels.investorDemoRibbon}
        </div>
      ) : null}

      <div className={`rounded-2xl border px-4 py-3 text-center text-lg font-semibold tracking-wide ${statusBanner}`}>
        STATUS: {report.status}
      </div>

      <DrBrainDay1Checklist sectionTitle={sectionLabels.checklistTitle} labels={sectionLabels.checklistItems} />

      {investorDemo && kpis ? (
        <DrBrainInvestorDemoCharts metrics={metrics} kpis={kpis} demoBanner={sectionLabels.investorDemoRibbon} />
      ) : (
        <DrBrainCharts metrics={metrics} labels={chartLabels} />
      )}

      <section className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-sm text-violet-950">
        <p className="text-base font-semibold">{sectionLabels.aiSectionTitle}</p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">{sectionLabels.summaryLabel}</p>
          <p className="mt-1">{explanation.summary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">{sectionLabels.causesLabel}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {explanation.causes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">{sectionLabels.impactLabel}</p>
          <p className="mt-1">{explanation.impact}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            {sectionLabels.recommendedActionsLabel}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {explanation.recommendedActions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-950">
        <p className="text-base font-semibold">{sectionLabels.predictiveSectionTitle}</p>
        <p className="text-xs text-sky-900">{sectionLabels.predictiveLead}</p>
        {predictive.length === 0 ? (
          <p className="text-stone-700">No predictive warnings for current hourly metrics.</p>
        ) : (
          <ul className="space-y-2">
            {predictive.map((p, i) => (
              <li
                key={`${p.message}-${i}`}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  p.level === "CRITICAL"
                    ? "border-red-300 bg-red-50 text-red-950"
                    : "border-amber-200 bg-amber-50 text-amber-950"
                }`}
              >
                <span className="font-semibold">{p.level}</span> · {p.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {investorDemo ? <DrBrainInvestorStory labels={sectionLabels.storyUi} /> : null}

      <DrBrainTicketsPanel tickets={tickets} investorDemo={investorDemo} labels={sectionLabels.ticketUi} />

      <section className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
        <p className="text-sm font-semibold text-amber-950">{sectionLabels.issuesTitle}</p>
        {issues.length === 0 ? (
          <p className="text-sm text-stone-700">No open issues flagged for this run.</p>
        ) : (
          <ul className="list-disc space-y-2 pl-5 text-sm text-stone-800">
            {issues.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2">Check</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">OK</th>
              <th className="px-4 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((r, i) => (
              <tr key={`${r.check}-${i}`} className="border-t border-stone-100 align-top">
                <td className="px-4 py-2 font-mono text-xs text-stone-800">{r.check}</td>
                <td className="px-4 py-2 text-xs">{r.level}</td>
                <td className="px-4 py-2 text-xs">{String(r.ok)}</td>
                <td className="px-4 py-2 text-xs text-stone-700">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-950">
        <p className="font-semibold">{sectionLabels.recommendationsTitle}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {report.recommendations.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-stone-900">{sectionLabels.maintenanceTitle}</p>
        <DrBrainMaintenanceActions />
      </section>
    </div>
  );
}

/** Legacy alias — identical component. */
export const DrBrainHealthPanel = DrBrainPanel;
