"use client";

import { useCallback, useEffect, useState } from "react";
import type { PolicyProposalAdminDashboardSummary, PolicyProposalInvestorDashboardSummary } from "@/modules/autonomous-marketplace/dashboard/policy-proposal-dashboard.service";
import type { PolicyProposal, PolicyProposalReport } from "@/modules/autonomous-marketplace/proposals/policy-proposal.types";

type ApiOk = {
  ok: true;
  report: PolicyProposalReport;
  adminSummary: PolicyProposalAdminDashboardSummary;
  investorSummary: PolicyProposalInvestorDashboardSummary;
};

const TYPE_BADGE: Record<PolicyProposal["type"], string> = {
  THRESHOLD_ADJUSTMENT: "bg-amber-500/20 text-amber-100",
  NEW_RULE: "bg-violet-500/20 text-violet-100",
  RULE_ORDER_REVIEW: "bg-cyan-500/20 text-cyan-100",
  REGION_POLICY_REVIEW: "bg-rose-500/20 text-rose-100",
  ACTION_POLICY_REVIEW: "bg-orange-500/20 text-orange-100",
  ENTITY_POLICY_REVIEW: "bg-fuchsia-500/20 text-fuchsia-100",
};

const PRI_BADGE: Record<PolicyProposal["priority"], string> = {
  CRITICAL: "border-rose-500/50 text-rose-200",
  HIGH: "border-orange-500/50 text-orange-200",
  MEDIUM: "border-amber-500/50 text-amber-200",
  LOW: "border-slate-600 text-slate-400",
};

function targetLine(t: PolicyProposal["target"]): string {
  const parts: string[] = [];
  if (t.metricKey) parts.push(t.metricKey);
  if (t.regionCode) parts.push(`region:${t.regionCode}`);
  if (t.actionType) parts.push(`action:${t.actionType}`);
  if (t.entityType) parts.push(`entity:${t.entityType}`);
  if (t.ruleId) parts.push(`rule:${t.ruleId}`);
  return parts.length ? parts.join(" · ") : "—";
}

function impactLine(p: PolicyProposal): string {
  const e = p.impactEstimate;
  const bits: string[] = [];
  if (e.expectedFalseNegativeRateDelta != null) bits.push(`ΔFN ${(e.expectedFalseNegativeRateDelta * 100).toFixed(1)}%`);
  if (e.expectedFalsePositiveRateDelta != null) bits.push(`ΔFP ${(e.expectedFalsePositiveRateDelta * 100).toFixed(1)}%`);
  if (e.expectedLeakedRevenueDelta != null) bits.push(`Δleak ${e.expectedLeakedRevenueDelta.toFixed(0)}`);
  if (e.expectedProtectedRevenueDelta != null) bits.push(`Δprot ${e.expectedProtectedRevenueDelta.toFixed(0)}`);
  return bits.length ? bits.join(", ") : "—";
}

export function PolicyProposalPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/autonomy/policy-proposals", { credentials: "same-origin" });
      const json = (await res.json()) as ApiOk | { ok?: boolean; error?: string };
      if (!res.ok || json.ok !== true || !("report" in json)) {
        const msg =
          typeof json === "object" && json && "error" in json && typeof json.error === "string"
            ? json.error
            : "Policy proposals unavailable.";
        setError(msg);
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Policy proposals unavailable.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-800" />
        <div className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
        <div className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  if (!data?.report) return null;

  const { report, adminSummary, investorSummary } = data;
  const top = report.proposals[0];

  if (report.proposals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
        No advisory proposals for this assembly window. Extend labeled feedback or run sandbox batches to populate proposals.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm text-slate-200">
      {top ?
        <div className="rounded-xl border border-premium-gold/25 bg-gradient-to-br from-slate-900/90 to-slate-950 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-premium-gold/90">Top proposal</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{top.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{top.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${PRI_BADGE[top.priority]}`}>{top.priority}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${TYPE_BADGE[top.type]}`}>{top.type}</span>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-300">
              evidence {top.evidence.length}
            </span>
          </div>
        </div>
      : null}

      <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Ops</span> · {adminSummary.operationalSummary}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500/90">Investor-facing</p>
        <p className="mt-2 text-xs leading-relaxed text-emerald-100/85">{investorSummary.narrative}</p>
        <dl className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-3">
          <div>
            <dt className="text-slate-600">Pipeline</dt>
            <dd className="text-slate-300">{investorSummary.governanceImprovementPipelineStatus}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Posture</dt>
            <dd className="text-slate-300">{investorSummary.controlAdaptationPosture}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Opportunity</dt>
            <dd className="text-slate-300">{investorSummary.riskReductionOpportunityLevel}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Badge label="threshold" active={adminSummary.thresholdProposalCount > 0} />
        <Badge label="new rule" active={adminSummary.newRuleProposalCount > 0} />
        <Badge label="rule order" active={adminSummary.ruleOrderProposalCount > 0} />
        <Badge label="region" active={adminSummary.regionReviewCount > 0} />
        <Badge label="action" active={adminSummary.actionReviewCount > 0} />
      </div>

      <ul className="space-y-3">
        {report.proposals.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-slate-800/90 bg-slate-950/50 p-4 shadow-sm shadow-black/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${TYPE_BADGE[p.type]}`}>{p.type}</span>
                  <span className={`rounded border px-2 py-0.5 text-[10px] ${PRI_BADGE[p.priority]}`}>{p.priority}</span>
                  <span className="text-[10px] text-slate-500">confidence {p.confidence}</span>
                </div>
                <h4 className="mt-2 font-medium text-white">{p.title}</h4>
              </div>
              <span className="font-mono text-[10px] text-slate-600">{p.id.slice(0, 24)}…</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{p.rationale}</p>
            <dl className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
              <div>
                <dt className="text-slate-600">Target</dt>
                <dd className="font-mono text-slate-300">{targetLine(p.target)}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Expected impact</dt>
                <dd className="font-mono text-slate-300">{impactLine(p)}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Evidence</dt>
                <dd className="text-slate-400">{p.evidence.length} item(s)</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 ${active ? "border border-emerald-500/40 bg-emerald-950/40 text-emerald-200" : "border border-slate-800 text-slate-600"}`}
    >
      {label}
    </span>
  );
}
