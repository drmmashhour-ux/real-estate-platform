/**
 * Evaluates marketplace snapshot and proposes bounded autonomous actions (no side effects here).
 */
import type {
  AreaInsightRow,
  CommandKpisPayload,
  HotLeadRow,
  OperatorSummaryRow,
  PricingRuleRow,
  StuckDealRow,
} from "../command/senior-command.service";
import type { AutonomousActionProposal } from "./senior-autonomous.types";
import { defaultRiskForAction } from "./senior-autonomous.types";

export type MarketplaceSnapshot = {
  kpis: CommandKpisPayload | null;
  operators: OperatorSummaryRow[];
  areas: AreaInsightRow[];
  hotLeads: HotLeadRow[];
  stuckDeals: StuckDealRow[];
  pricingRules: PricingRuleRow[];
};

export function evaluateMarketplaceState(snapshot: MarketplaceSnapshot): AutonomousActionProposal[] {
  const out: AutonomousActionProposal[] = [];

  for (const op of snapshot.operators) {
    if (op.avgResponseHours != null && op.avgResponseHours > 18 && op.tier !== "green") {
      out.push({
        actionType: "REDUCE_OPERATOR_VISIBILITY",
        payload: { operatorId: op.operatorId, delta: -1, primaryResidenceId: op.primaryResidenceId },
        reason: `Operator ${op.operatorName} shows slow average response (${op.avgResponseHours}h) — bounded visibility reduction.`,
        confidence: Math.min(0.92, 0.55 + Math.min(0.35, (op.avgResponseHours - 18) / 48)),
        riskLevel: defaultRiskForAction("REDUCE_OPERATOR_VISIBILITY"),
        impactConversionPct: 3,
        impactRevenuePct: -2,
      });
    }
    if (op.avgResponseHours != null && op.avgResponseHours <= 6 && op.tier === "green" && op.rankingScore != null) {
      out.push({
        actionType: "BOOST_OPERATOR",
        payload: { operatorId: op.operatorId, delta: 1, primaryResidenceId: op.primaryResidenceId },
        reason: `Strong response profile for ${op.operatorName} — small visibility boost.`,
        confidence: 0.72,
        riskLevel: defaultRiskForAction("BOOST_OPERATOR"),
        impactConversionPct: 4,
        impactRevenuePct: 3,
      });
    }
  }

  for (const a of snapshot.areas.slice(0, 6)) {
    if (a.demandSignal === "high" && a.supplySignal === "tight") {
      const rule = snapshot.pricingRules.find(
        (r) => r.city && a.city.toLowerCase() === r.city?.toLowerCase(),
      );
      if (rule) {
        out.push({
          actionType: "INCREASE_PRICE",
          payload: {
            pricingRuleId: rule.id,
            city: a.city,
            demandFactorMultiplier: 1.08,
            qualityFactorMultiplier: 1.02,
          },
          reason: `Elevated demand and tight supply in ${a.city} — modest lead price uplift (capped).`,
          confidence: 0.68,
          riskLevel: "HIGH",
          impactConversionPct: -1,
          impactRevenuePct: 10,
        });
      }
      out.push({
        actionType: "SUGGEST_EXPANSION",
        payload: { city: a.city, leads: a.leads, note: "Onboard operators or unlock inventory" },
        reason: `${a.city} shows demand pressure — recommend targeted operator onboarding.`,
        confidence: 0.61,
        riskLevel: "HIGH",
        impactConversionPct: 6,
        impactRevenuePct: 12,
      });
    }
  }

  for (const lead of snapshot.hotLeads.slice(0, 8)) {
    if (lead.urgency === "HIGH" && lead.status === "NEW") {
      out.push({
        actionType: "PRIORITIZE_LEAD",
        payload: { leadId: lead.id },
        reason: `High-urgency lead for ${lead.residenceName} — CRM prioritization.`,
        confidence: 0.78,
        riskLevel: "LOW",
        impactConversionPct: 8,
        impactRevenuePct: 5,
      });
    }
  }

  for (const s of snapshot.stuckDeals.slice(0, 10)) {
    if (s.issue.includes("6 hours") || s.issue.includes("No response")) {
      out.push({
        actionType: "TRIGGER_FOLLOWUP",
        payload: { leadId: s.leadId, channel: "internal_queue" },
        reason: `Stale lead ${s.leadId.slice(0, 8)} — queue internal follow-up (no external send without consent).`,
        confidence: 0.74,
        riskLevel: "LOW",
        impactConversionPct: 5,
        impactRevenuePct: 2,
      });
    }
  }

  if ((snapshot.kpis?.highQualityPct ?? 0) > 35 && (snapshot.kpis?.avgResponseTimeHours ?? 0) > 14) {
    out.push({
      actionType: "FLAG_RISK",
      payload: { code: "QUALITY_VS_SPEED", detail: "High lead quality but slow operator responses" },
      reason: "Quality intake is strong but operator throughput may cap conversion — review staffing.",
      confidence: 0.66,
      riskLevel: "HIGH",
      impactConversionPct: null,
      impactRevenuePct: null,
    });
  }

  return dedupeProposals(out).slice(0, 24);
}

function dedupeProposals(p: AutonomousActionProposal[]): AutonomousActionProposal[] {
  const seen = new Set<string>();
  const r: AutonomousActionProposal[] = [];
  for (const x of p) {
    const key = `${x.actionType}:${JSON.stringify(x.payload).slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    r.push(x);
  }
  return r;
}
