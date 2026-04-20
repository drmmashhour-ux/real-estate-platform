"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { UnifiedGovernanceResult } from "@/modules/autonomous-marketplace/governance/unified-governance.types";
import {
  buildGovernanceAdminSummarySlice,
  buildGovernanceInvestorSummarySlice,
} from "@/modules/autonomous-marketplace/dashboard/governance-dashboard.service";

function governanceRiskPanelCopy() {
  return {
    panelTitle: "Governance risk",
    dispositionLabel: "Disposition",
    legalCardTitle: "Legal risk",
    fraudCardTitle: "Fraud / revenue",
    combinedCardTitle: "Combined risk",
    revenueAtRiskLabel: "Revenue at risk (est.)",
    explainTitle: "Explainability",
    traceTitle: "Rule trace",
    investorBlockTitle: "Investor summary",
    levelPrefix: "Level",
    scorePrefix: "Score",
    emptyTrace: "No trace rows for this evaluation.",
  } as const;
}

function badgeClass(disposition: UnifiedGovernanceResult["disposition"]): string {
  if (disposition === "AUTO_EXECUTE" || disposition === "ALLOW_PREVIEW") return "bg-emerald-500/15 text-emerald-200";
  if (
    disposition === "REJECTED" ||
    disposition === "BLOCKED_FOR_REGION" ||
    disposition === "REQUIRE_APPROVAL" ||
    disposition === "REQUIRES_LOCAL_APPROVAL"
  ) {
    return "bg-red-500/15 text-red-200";
  }
  return "bg-amber-500/15 text-amber-100";
}

export type GovernanceRiskPanelProps = {
  result: UnifiedGovernanceResult;
};

export function GovernanceRiskPanel({ result }: GovernanceRiskPanelProps) {
  const copy = governanceRiskPanelCopy();
  const admin = useMemo(() => buildGovernanceAdminSummarySlice(result), [result]);
  const investor = useMemo(() => buildGovernanceInvestorSummarySlice(result), [result]);
  const [traceOpen, setTraceOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 text-sm text-white/90">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{copy.panelTitle}</h3>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(result.disposition)}`}
        >
          {result.disposition}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.legalCardTitle}</div>
          <div className="mt-1 text-lg font-semibold">{result.legalRisk.level}</div>
          <div className="text-xs text-white/55">
            {copy.scorePrefix}: {result.legalRisk.score}
          </div>
        </Card>
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.fraudCardTitle}</div>
          <div className="mt-1 text-lg font-semibold">{result.fraudRisk.level}</div>
          <div className="text-xs text-white/55">
            {copy.scorePrefix}: {result.fraudRisk.score}
          </div>
        </Card>
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.combinedCardTitle}</div>
          <div className="mt-1 text-lg font-semibold">{result.combinedRisk.level}</div>
          <div className="text-xs text-white/55">
            {copy.scorePrefix}: {result.combinedRisk.score}
          </div>
        </Card>
      </div>

      <Card className="!p-3">
        <div className="text-xs uppercase tracking-wide text-white/50">{copy.revenueAtRiskLabel}</div>
        <div className="mt-1 font-mono text-lg">{result.fraudRisk.revenueImpactEstimate}</div>
      </Card>

      <Card className="!p-3">
        <div className="text-xs uppercase tracking-wide text-white/50">{copy.explainTitle}</div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-white/80">
          {result.explainability.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/70 hover:bg-white/5"
          onClick={() => setTraceOpen((o) => !o)}
          aria-expanded={traceOpen}
        >
          {copy.traceTitle}
          <span className="text-white/40">{traceOpen ? "−" : "+"}</span>
        </button>
        {traceOpen ?
          <div className="border-t border-white/10 px-3 py-2 text-xs text-white/75">
            {result.trace.length === 0 ?
              <p className="text-white/50">{copy.emptyTrace}</p>
            : <ul className="space-y-1">
                {result.trace.map((t) => (
                  <li key={`${t.step}-${t.ruleId}`}>
                    <span className="font-mono text-white/55">#{t.step}</span> {t.ruleId}{" "}
                    <span className="text-white/45">{t.matched ? "matched" : "no match"}</span>
                    {t.outcome ? ` → ${t.outcome}` : ""}
                  </li>
                ))}
              </ul>
            }
          </div>
        : null}
      </Card>

      <Card className="!p-3">
        <div className="text-xs uppercase tracking-wide text-white/50">{copy.investorBlockTitle}</div>
        <p className="mt-2 text-white/80">{investor.narrativeSummary}</p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/60">
          <div>
            <dt>Alert</dt>
            <dd className="text-white/90">{admin.alertSeverity}</dd>
          </div>
          <div>
            <dt>Oversight</dt>
            <dd className="text-white/90">{investor.humanOversightStatus}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
