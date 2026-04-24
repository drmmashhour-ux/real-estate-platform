import { getOrCreateCeoPolicy, requiresApprovalForProposal } from "@/modules/ceo-ai/ceo-ai-policy";
import { proposeGrowthDecisions } from "@/modules/ceo-ai/ceo-ai-growth.service";
import { proposePricingDecisions } from "@/modules/ceo-ai/ceo-ai-pricing.service";
import { proposeOutreachDecisions } from "@/modules/ceo-ai/ceo-ai-outreach.service";
import { proposeRetentionDecisions } from "@/modules/ceo-ai/ceo-ai-retention.service";
import { proposeFundDecisions } from "@/modules/ceo-ai/ceo-ai-fund.service";
import { proposeCapitalDecisions } from "@/modules/ceo-ai/ceo-ai-capital.service";
import { buildCeoContextFingerprint } from "./ceo-memory-context.service";
import { mapPayloadKindToDecisionType } from "./ceo-memory.service";
import { evaluateGoalAlignment } from "./ceo-long-term-goals.service";
import { prisma } from "@/lib/db";
import { aiCeoLog } from "../ai-ceo/ai-ceo-log";
import type {
  CeoDecisionProposal,
  CeoMarketSignals,
  GenerateCeoDecisionsResult,
  ProblemOpportunityItem,
} from "@/modules/ceo-ai/ceo-ai.types";

function dedupeKey(p: CeoDecisionProposal): string {
  return `${p.domain}:${p.title}`;
}

function pickProblems(signals: CeoMarketSignals): ProblemOpportunityItem[] {
  const items: ProblemOpportunityItem[] = [];

  if (signals.seniorConversionRate30d < 0.055) {
    items.push({
      title: "Trailing conversion below target",
      detail: `Senior lead→close rate ${(signals.seniorConversionRate30d * 100).toFixed(1)}% (30d).`,
      severityOrLift: 0.78,
    });
  }
  if (signals.demandIndex < 0.4 && signals.leadsLast30d > 12) {
    items.push({
      title: "Soft demand index with inventory risk",
      detail: `DemandIdx ${signals.demandIndex.toFixed(2)} with ${signals.leadsLast30d} inbound leads.`,
      severityOrLift: 0.64,
    });
  }
  if (signals.churnInactiveBrokersApprox > 15) {
    items.push({
      title: "Broker inactive pool expanding",
      detail: `~${signals.churnInactiveBrokersApprox} inactive broker accounts flagged.`,
      severityOrLift: 0.7,
    });
  }
  return items.sort((a, b) => b.severityOrLift - a.severityOrLift).slice(0, 5);
}

function pickOpportunities(signals: CeoMarketSignals): ProblemOpportunityItem[] {
  const items: ProblemOpportunityItem[] = [];

  if (signals.demandIndex > 0.58 && signals.seniorConversionRate30d > 0.075) {
    items.push({
      title: "High-demand + healthy conversion window",
      detail: "Elasticity likely supports pricing/GTM experiments with controlled risk.",
      severityOrLift: 0.72,
    });
  }
  if (signals.leadsLast30d > signals.leadsPrev30d * 1.12) {
    items.push({
      title: "Inbound acceleration vs prior 30d",
      detail: `Leads ${signals.leadsLast30d} vs ${signals.leadsPrev30d} prior.`,
      severityOrLift: 0.65,
    });
  }
  if (signals.seoPagesIndexedApprox > 100 && signals.emailEngagementScore != null && signals.emailEngagementScore > 0.35) {
    items.push({
      title: "SEO + email flywheel engagement",
      detail: "Strong surface area to cross-sell operator programs and family content.",
      severityOrLift: 0.58,
    });
  }
  return items.sort((a, b) => b.severityOrLift - a.severityOrLift).slice(0, 5);
}

function operationsCampaignProposal(signals: CeoMarketSignals): CeoDecisionProposal | null {
  if (signals.leadsLast30d < 8) return null;

  return {
    domain: "OPERATIONS",
    title: "Cross-channel referral burst (concept)",
    summary:
      "Coordinate lightweight referral incentives with partner clinics + geo-targeted landing refresh.",
    rationale:
      "Balances acquisition cost vs retention pressure when pipeline velocity is acceptable but needs diversification.",
    confidence: 0.56,
    impactEstimate: 0.045,
    requiresApproval: true,
    payload: {
      kind: "campaign_recommend",
      channel: "partner_clinic_geo",
      headline: "Families researching care nearby",
      bullets: ["Partner tear-off PDF", "Geo SMS retarget", "Broker co-host webinar"],
    },
  };
}

/**
 * Detect strongest constraints, propose highest-impact bounded actions, dedupe, cap length.
 */
export async function generateCeoDecisions(
  signals: CeoMarketSignals,
  options?: { maxDecisions?: number }
): Promise<GenerateCeoDecisionsResult> {
  const policy = await getOrCreateCeoPolicy();
  const max = Math.min(options?.maxDecisions ?? policy.maxDailyChanges, 25);

  const combined: CeoDecisionProposal[] = [
    ...proposeGrowthDecisions(signals),
    ...(await proposePricingDecisions(signals)),
    ...(await proposeOutreachDecisions(signals)),
    ...proposeRetentionDecisions(signals),
    ...(await proposeFundDecisions(signals)),
    ...(await proposeCapitalDecisions(signals)),
  ];

  const ops = operationsCampaignProposal(signals);
  if (ops) combined.push(ops);

  // Phase 6: Strategy Memory Awareness
  const fingerprint = buildCeoContextFingerprint(signals);
  const patterns = await prisma.ceoStrategyPattern.findMany({
    where: { contextFingerprint: fingerprint }
  });
  
  const patternData = new Map(patterns.map(p => [p.patternKey, { score: p.score, timesUsed: p.timesUsed }]));
  const alignments = await evaluateGoalAlignment(combined);
  const alignmentMap = new Map(alignments.map(a => [a.title, a]));

  const seen = new Set<string>();
  const normalized: CeoDecisionProposal[] = [];
  for (const p of combined) {
    const ra = requiresApprovalForProposal(p.domain, p.payload, policy);
    
    // Memory-based confidence adjustment
    const decisionType = mapPayloadKindToDecisionType(p.payload.kind);
    const patternKey = `${p.domain}:${fingerprint}:${decisionType}`;
    const historical = patternData.get(patternKey);
    const historicalScore = historical?.score || 0;
    const timesUsed = historical?.timesUsed || 0;
    
    let confidence = p.confidence || 0.5;
    let memorySignal = "neutral";
    
    // Safety Bound: Only apply memory signals if we have a significant sample
    if (timesUsed >= 2) {
      if (historicalScore > 5) {
        confidence = Math.min(1, confidence + 0.1);
        memorySignal = "positive history boost";
      } else if (historicalScore < -5) {
        confidence = Math.max(0.1, confidence - 0.15);
        memorySignal = "negative history penalty";
      }
    } else if (timesUsed > 0) {
      memorySignal = "low sample - skipping adjustment";
    }

    // Goal alignment boost
    const align = alignmentMap.get(p.title);
    if (align && align.alignmentScore > 0) {
      confidence = Math.min(1, confidence + align.alignmentScore);
    }

    if (memorySignal !== "neutral") {
      aiCeoLog("info", "memory_signal_applied", { 
        title: p.title, 
        patternKey, 
        score: historicalScore,
        signal: memorySignal 
      });
    }

    const adjusted: CeoDecisionProposal = { 
      ...p, 
      requiresApproval: ra,
      confidence,
      // Add memory details to rationale
      rationale: `${p.rationale} (Memory: ${memorySignal}, score: ${historicalScore.toFixed(1)}${align?.goalNames.length ? `, Goals: ${align.goalNames.join(', ')}` : ''})`
    };

    const k = dedupeKey(adjusted);
    if (seen.has(k)) continue;
    seen.add(k);
    normalized.push(adjusted);
    if (normalized.length >= max) break;
  }

  return {
    topProblems: pickProblems(signals),
    topOpportunities: pickOpportunities(signals),
    proposedDecisions: normalized,
  };
}
