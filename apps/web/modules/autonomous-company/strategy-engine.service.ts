/**
 * Strategy layer — high-level objectives from read-only subsystem signals (no execution).
 */
import type { StrategyEngineOutput, StrategyObjective, StrategyOpportunity, StrategyPriority, StrategyRisk } from "./autonomous-company.types";
import { AUTONOMOUS_COMPANY_MAX_OBJECTIVES } from "./autonomous-company.safety";

export type StrategyEngineInput = {
  fusionAgreement?: number | null;
  fusionConflictCount?: number | null;
  fusionSubsystemCoverage?: string | null;
  croHealthScore?: number | null;
  marketplaceHint?: string | null;
};

export function buildStrategyEngineOutput(input: StrategyEngineInput): StrategyEngineOutput {
  const notes: string[] = [];
  const objectives: StrategyObjective[] = [];
  const opportunities: StrategyOpportunity[] = [];
  const risks: StrategyRisk[] = [];
  const priorities: StrategyPriority[] = [];

  const agree = input.fusionAgreement ?? null;
  const cc = input.fusionConflictCount ?? 0;

  if (agree !== null && Number.isFinite(agree)) {
    objectives.push({
      id: "obj_fusion_alignment",
      title: "Maintain cross-domain alignment",
      rationale: `Fusion agreement score ~${agree.toFixed(2)} — prioritize consensus-building experiments.`,
    });
  } else {
    notes.push("Fusion summary unavailable — objectives partially generic.");
  }

  objectives.push({
    id: "obj_growth_sustainable",
    title: "Sustainable acquisition growth",
    rationale: "Directional focus: improve measurable funnel and ads efficiency without bypassing guardrails.",
  });

  if (input.croHealthScore !== null && input.croHealthScore !== undefined && Number.isFinite(input.croHealthScore)) {
    opportunities.push({
      id: "opp_cro_health",
      domain: "cro",
      summary: `CRO health snapshot ~${input.croHealthScore.toFixed(0)}/100 — review bottleneck stages in diagnostics.`,
    });
  }

  opportunities.push({
    id: "opp_scale_ads",
    domain: "ads",
    summary: "Scale validated ad paths where monitoring shows stable V8 primary success rates.",
  });

  if (input.marketplaceHint) {
    opportunities.push({
      id: "opp_marketplace",
      domain: "marketplace",
      summary: input.marketplaceHint,
    });
  }

  if (cc > 6) {
    risks.push({
      id: "risk_fusion_conflicts",
      severity: "high",
      summary: `${cc} cross-system conflicts flagged — de-prioritize conflicting automation until reviewed.`,
    });
  } else if (cc > 0) {
    risks.push({
      id: "risk_fusion_conflicts",
      severity: "medium",
      summary: "Cross-domain tension present — prefer shadow/assist execution tiers.",
    });
  }

  risks.push({
    id: "risk_execution_scope",
    severity: "low",
    summary: "Operator plans remain bounded by guardrails — no financial or legal bypass.",
  });

  priorities.push(
    { rank: 1, label: "Evidence-backed funnel fixes (CRO + product)" },
    { rank: 2, label: "Ads efficiency on validated cohorts" },
    { rank: 3, label: "Supply/demand balance on marketplace listings" },
  );

  const cap = AUTONOMOUS_COMPANY_MAX_OBJECTIVES;
  return {
    objectives: objectives.slice(0, cap),
    opportunities: opportunities.slice(0, cap),
    risks,
    priorities,
    notes,
  };
}
