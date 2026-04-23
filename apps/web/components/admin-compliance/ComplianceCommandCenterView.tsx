"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Shield } from "lucide-react";
import type { ComplianceCommandCenterPayload } from "@/modules/compliance-admin/compliance-command-center.service";
import type { ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";
import { complianceAdminFlags } from "@/config/feature-flags";
import { ComplianceAdminNav } from "./ComplianceAdminNav";
import { ComplianceKPIBar } from "./ComplianceKPIBar";
import { ComplianceCaseQueue } from "./ComplianceCaseQueue";
import { QAReviewBoard } from "./QAReviewBoard";
import { EscalationPanel } from "./EscalationPanel";
import { ComplianceTrendCard } from "./ComplianceTrendCard";
import { BlockedClosingsPanel } from "./BlockedClosingsPanel";
import { ReviewerWorkloadPanel } from "./ReviewerWorkloadPanel";
import { ReviewChecklistPanel } from "./ReviewChecklistPanel";
import { InsuranceTrustMonitoring } from "./InsuranceTrustMonitoring";

export function ComplianceCommandCenterView(props: {
  data: ComplianceCommandCenterPayload;
  navActive: "/admin/compliance" | "/admin/compliance/cases" | "/admin/compliance/reviews" | "/admin/compliance/analytics";
  mode: "overview" | "cases" | "reviews" | "analytics";
}) {
  const router = useRouter();
  const [data, setData] = useState(props.data);
  const [window, setWindow] = useState<ComplianceAnalyticsWindow>(props.data.window);
  const [busy, setBusy] = useState(false);

  const onWindowChange = useCallback(async (w: ComplianceAnalyticsWindow) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/compliance/analytics?window=${encodeURIComponent(w)}`);
      const j = (await r.json()) as { analytics?: (typeof data)["analytics"]; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed to load analytics");
      if (j.analytics) {
        setWindow(w);
        setData((prev) => ({ ...prev, analytics: j.analytics!, window: w }));
      }
    } catch {
      /* keep prior analytics */
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = () => router.refresh();

  const trendRows = data.severityTrends30d.map((t) => ({
    label: t.severity,
    count: t.count,
  }));

  const checklistAgg = {
    pending: data.checklistStats.pending,
    passed: data.checklistStats.passed,
    failed: data.checklistStats.failed,
  };

  return (
    <div className="space-y-8 text-zinc-100">
      <header className="space-y-2 border-b border-amber-500/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500/90">LECIPM · Internal ops</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Compliance command center</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
          Supervisory visibility over workflow-derived signals and brokerage QA. Nothing here constitutes a regulatory
          finding; escalate to qualified personnel when needed.
        </p>
        <ComplianceAdminNav active={props.navActive} />
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Refresh data
          </button>
        </div>
      </header>

      {(props.mode === "overview" ||
        props.mode === "analytics" ||
        props.mode === "reviews" ||
        props.mode === "cases") && (
        <ComplianceKPIBar
          analytics={data.analytics}
          analyticsWindow={window}
          onWindowChange={onWindowChange}
          busy={busy}
        />
      )}

      {props.mode === "overview" && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <BlockedClosingsPanel count={data.analytics.blockedClosings} />
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Supervisory queues</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                <li className="flex justify-between">
                  <span>Critical cases</span>
                  <span className="font-semibold text-red-300">{data.queues.criticalComplianceCases}</span>
                </li>
                <li className="flex justify-between">
                  <span>Overdue QA (5d+ idle)</span>
                  <span className="font-semibold text-amber-200">{data.queues.overdueQaReviews}</span>
                </li>
                <li className="flex justify-between">
                  <span>Closing readiness cases</span>
                  <span className="font-semibold text-orange-200">{data.queues.closingReadinessCases}</span>
                </li>
                <li className="flex justify-between">
                  <span>Open escalations</span>
                  <span className="font-semibold text-zinc-100">{data.queues.openEscalations}</span>
                </li>
              </ul>
            </div>
            <ComplianceTrendCard title="Case severity (30d)" rows={trendRows} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ComplianceCaseQueue cases={data.cases} />
            <div className="space-y-6">
              <QAReviewBoard reviews={data.reviews} />
              <EscalationPanel rows={data.recentEscalations} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReviewerWorkloadPanel reviews={data.reviews} />
            <ReviewChecklistPanel {...checklistAgg} />
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              Insurance & Trust Intelligence
            </h2>
            <InsuranceTrustMonitoring monitoring={data.insuranceMonitoring} />
          </section>

          {complianceAdminFlags.complianceRuleEngineV1 && <RunRuleEngineHint />}
        </>
      )}

      {props.mode === "cases" && <ComplianceCaseQueue cases={data.cases} />}

      {props.mode === "reviews" && (
        <div className="space-y-6">
          <QAReviewBoard reviews={data.reviews} />
          <ReviewerWorkloadPanel reviews={data.reviews} />
        </div>
      )}

      {props.mode === "analytics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ComplianceTrendCard title="Case severity (30d)" rows={trendRows} />
          <BlockedClosingsPanel count={data.analytics.blockedClosings} />
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">Top finding categories (window)</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {data.analytics.topFindingCategories.map((c) => (
                <li key={c.caseType} className="flex justify-between rounded-lg bg-black/30 px-3 py-2">
                  <span>{c.caseType.replace(/_/g, " ")}</span>
                  <span className="text-amber-200/90">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function RunRuleEngineHint() {
  return (
    <div className="rounded-xl border border-dashed border-amber-500/25 bg-amber-500/5 p-4 text-sm text-zinc-400">
      <p className="font-medium text-amber-100/90">Run compliance engine</p>
      <p className="mt-1">
        POST <span className="font-mono text-xs text-zinc-300">/api/admin/compliance/run</span> with{" "}
        <code className="font-mono text-xs text-amber-200/80">{`{ "dealId": "…" }`}</code> from tooling or the deal admin
        pipeline. UI trigger can be added next to each deal row.
      </p>
    </div>
  );
}
