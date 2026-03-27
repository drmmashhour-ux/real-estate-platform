import { prisma } from "@/lib/db";
import { computeCrmLeadScore } from "@/lib/leads/scoring";
import { estimateBrokerCommissionDollars } from "@/lib/leads/commission";
import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";

/**
 * Recompute CRM rule-score for evaluation leads when engagement flags change.
 * Syncs dealValue + commissionEstimate from evaluation snapshot.
 */
export async function refreshEvaluationLeadCrmScore(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.leadSource !== "evaluation_lead") return;

  const ai = (lead.aiExplanation ?? {}) as Record<string, unknown>;
  const prop = (ai.property ?? {}) as Record<string, unknown>;
  const val = (ai.valuation ?? {}) as Record<string, unknown>;
  const eng = (ai.evaluationEngagement ?? {}) as Record<string, unknown>;
  const visits = (ai.evaluationVisits ?? {}) as Record<string, unknown>;
  const resultViews = typeof visits.resultViewCount === "number" ? visits.resultViewCount : 0;

  const city = typeof prop.city === "string" ? prop.city : "";
  const estimatedValue =
    typeof val.estimatedValue === "number"
      ? val.estimatedValue
      : typeof val.estimate === "number"
        ? val.estimate
        : 0;
  const surfaceSqft = typeof prop.surfaceSqft === "number" ? prop.surfaceSqft : 0;

  const call = eng.call === true;
  const wa = eng.whatsapp === true;
  const consult = eng.consultationCta === true;

  const { score, band, breakdown } = computeCrmLeadScore({
    city,
    estimatedValue,
    surfaceSqft,
    message: lead.message,
    clickedConsultationCta: consult,
    clickedCall: call,
    clickedWhatsapp: wa,
    clickedCallOrWhatsapp: false,
    repeatResultViews: resultViews >= 2,
  });

  const snapEst = extractEvaluationSnapshot(lead.aiExplanation)?.estimate;
  const dealValue =
    estimatedValue > 0 ? estimatedValue : snapEst != null && snapEst > 0 ? snapEst : lead.dealValue;
  const commissionEstimate = estimateBrokerCommissionDollars(dealValue ?? null);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score,
      aiTier: band,
      ...(dealValue != null && dealValue > 0
        ? { dealValue, ...(commissionEstimate != null ? { commissionEstimate } : {}) }
        : {}),
      aiExplanation: {
        ...ai,
        crmScoring: {
          score,
          band,
          breakdown,
          updatedAt: new Date().toISOString(),
        },
      } as object,
    },
  });
}
