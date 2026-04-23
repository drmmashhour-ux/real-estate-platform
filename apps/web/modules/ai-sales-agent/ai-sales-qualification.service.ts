import { prisma } from "@/lib/db";

import { recordAiSalesEvent } from "./ai-sales-log.service";
import type { AiSalesQualificationResult, AiSalesQualificationTier } from "./ai-sales.types";

function tierFromSignals(input: {
  dealValue: number | null;
  highIntent: boolean;
  message: string;
  timelineHits: number;
}): { tier: AiSalesQualificationTier; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (input.highIntent) {
    score += 2;
    reasons.push("high_intent_flag");
  }
  if (input.dealValue != null && input.dealValue >= 400_000) {
    score += 2;
    reasons.push("deal_band_upper");
  } else if (input.dealValue != null && input.dealValue >= 250_000) {
    score += 1;
    reasons.push("deal_band_mid");
  }
  const m = input.message.toLowerCase();
  if (/\b(visit|showing|voir|visite|book|schedule)\b/i.test(m)) {
    score += 2;
    reasons.push("visit_language");
  }
  if (/\b(soon|asap|cette semaine|this week|urgent)\b/i.test(m)) {
    score += 1;
    reasons.push("urgency_language");
  }
  score += Math.min(2, input.timelineHits);

  let tier: AiSalesQualificationTier = "COLD";
  if (score >= 5) tier = "HOT";
  else if (score >= 3) tier = "WARM";

  return { tier, reasons };
}

/**
 * Rule-based qualification from existing CRM fields + funnel density (no duplicate CRM rows).
 * Persists summary into `aiExplanation.aiSalesQualification` for broker visibility.
 */
export async function qualifySalesLead(leadId: string): Promise<AiSalesQualificationResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      message: true,
      dealValue: true,
      estimatedValue: true,
      highIntent: true,
      purchaseRegion: true,
      aiExplanation: true,
    },
  });

  const timelineHits = await prisma.leadTimelineEvent.count({
    where: {
      leadId,
      eventType: { startsWith: "FUNNEL_" },
    },
  });

  const deal = lead?.dealValue ?? lead?.estimatedValue ?? null;
  const { tier, reasons } = tierFromSignals({
    dealValue: deal,
    highIntent: Boolean(lead?.highIntent),
    message: lead?.message ?? "",
    timelineHits,
  });

  const intent: AiSalesQualificationResult["intent"] =
    /\b(rent|lease|location|louer)\b/i.test(lead?.message ?? "") ? "rent" : /\b(buy|purchase|acheter)\b/i.test(lead?.message ?? "") ? "buy" : "unknown";

  const summary = [
    `Tier ${tier}`,
    intent !== "unknown" ? (intent === "buy" ? "Buying intent suggested" : "Renting intent suggested") : null,
    lead?.purchaseRegion ? `Region hint: ${lead.purchaseRegion}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const result: AiSalesQualificationResult = {
    tier,
    reasons,
    summary,
    intent,
    timeline: tier === "HOT" ? "≤30d (heuristic)" : tier === "WARM" ? "≤60d (heuristic)" : "unknown",
    budgetBand:
      deal != null ? (deal >= 750_000 ? "750k+" : deal >= 500_000 ? "500–750k" : deal >= 300_000 ? "300–500k" : "<300k") : undefined,
    preferredArea: lead?.purchaseRegion ?? undefined,
  };

  const prev = (lead?.aiExplanation as Record<string, unknown> | null) ?? {};
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      aiTier: tier === "HOT" ? "hot" : tier === "WARM" ? "warm" : "cold",
      aiExplanation: {
        ...prev,
        aiSalesQualification: {
          ...result,
          evaluatedAt: new Date().toISOString(),
          timelineEventCount: timelineHits,
        },
      },
    },
  });

  await recordAiSalesEvent(leadId, "AI_SALES_QUALIFICATION", {
    assistant: "lecipm",
    mode: "SAFE_AUTOPILOT",
    explain: "rule_based_qualification",
    metadata: { tier, reasons },
  });

  return result;
}
