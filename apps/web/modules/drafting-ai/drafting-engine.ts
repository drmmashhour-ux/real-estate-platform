import type { Deal } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealExecutionFlags } from "@/config/feature-flags";
import { buildDraftingContextBundle } from "@/modules/deal-intelligence/drafting-context.builder";
import { BROKER_REVIEW_LABEL } from "@/modules/legal-knowledge/legal-knowledge.types";
import { suggestClausesForDeal, type ClauseSuggestionOutput } from "./clause-suggester";
import { buildFieldPrefillProposal } from "./field-prefill-engine";
import { runComplianceForDealDrafting } from "./compliance-checker";

export type PersistedDraftingSuggestion = {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  severity: string;
  sourceAttribution: Record<string, unknown> | null;
};

export type DraftingEngineResponse = {
  disclaimer: string;
  brokerReviewBanner: typeof BROKER_REVIEW_LABEL;
  context: ReturnType<typeof buildDraftingContextBundle>;
  clauseSuggestions: ClauseSuggestionOutput[];
  fieldPrefill: ReturnType<typeof buildFieldPrefillProposal>;
  compliance: Awaited<ReturnType<typeof runComplianceForDealDrafting>>;
  /** Rows written to `DealCopilotSuggestion` when `persistSuggestions` is true — use these IDs for approve/reject. */
  reviewQueueSuggestions: PersistedDraftingSuggestion[];
};

const SUGGESTION_TYPE = "legal_grounded_drafting_v1";

/**
 * Safe-mode drafting bundle: generates reviewable suggestions and optionally persists copilot rows (pending).
 */
export async function runDraftingEngineSafeMode(
  deal: Deal & { dealParties?: { id: string }[] },
  opts?: { persistSuggestions?: boolean },
): Promise<DraftingEngineResponse> {
  if (!dealExecutionFlags.contractIntelligenceV1) {
    return {
      disclaimer: "Drafting assistance disabled — enable contract intelligence feature flag.",
      brokerReviewBanner: BROKER_REVIEW_LABEL,
      context: buildDraftingContextBundle(deal),
      clauseSuggestions: [],
      fieldPrefill: [],
      compliance: {
        issues: [],
        disclaimer: "",
        generatedAt: new Date().toISOString(),
      },
      reviewQueueSuggestions: [],
    };
  }

  const [clauseSuggestions, compliance] = await Promise.all([suggestClausesForDeal(deal), runComplianceForDealDrafting(deal)]);
  const fieldPrefill = buildFieldPrefillProposal(deal);
  const context = buildDraftingContextBundle(deal);

  const reviewQueueSuggestions: PersistedDraftingSuggestion[] = [];
  if (opts?.persistSuggestions && clauseSuggestions.length) {
    const top = clauseSuggestions.slice(0, 12);
    for (const s of top) {
      const row = await prisma.dealCopilotSuggestion.create({
        data: {
          dealId: deal.id,
          suggestionType: SUGGESTION_TYPE,
          title: s.title,
          summary: s.suggestion,
          confidence: s.confidence,
          severity: s.severity,
          reasons: [s.whyGenerated, s.source.explanation] as Prisma.InputJsonValue,
          recommendedAction: "Review source attribution and adapt language to this file.",
          brokerReviewRequired: true,
          status: "pending",
          sourceAttribution: {
            source: s.source.source,
            page: s.source.page,
            section: s.source.section,
            explanation: s.source.explanation,
            requiresBrokerReview: true,
          } as Prisma.InputJsonValue,
        },
      });
      reviewQueueSuggestions.push({
        id: row.id,
        title: row.title,
        summary: row.summary,
        confidence: row.confidence,
        severity: row.severity,
        sourceAttribution: row.sourceAttribution as Record<string, unknown> | null,
      });
    }
  }

  return {
    disclaimer:
      "AI-assisted brokerage drafting — not legal advice. Official OACIQ forms and your agency instructions prevail. " +
      "All outputs require broker review before reliance or filing.",
    brokerReviewBanner: BROKER_REVIEW_LABEL,
    context,
    clauseSuggestions,
    fieldPrefill,
    compliance,
    reviewQueueSuggestions,
  };
}
