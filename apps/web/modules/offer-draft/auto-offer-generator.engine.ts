import { computeNegotiationStrategies } from "@/modules/deal/negotiation-ai.engine";
import {
  defaultExclusions,
  defaultInclusions,
  OFFER_CLAUSE_LIBRARY,
  renderClauseTemplate,
} from "./offer-clause-library";
import { buildOfferDraftContext, type OfferDraftContext } from "./offer-draft-context.service";

export type FieldRationale = {
  value: unknown;
  sources: Array<{ type: string; ref: string; note?: string }>;
};

export type OfferDraftGenerated = {
  purchasePrice: number;
  depositAmount: number;
  financingDeadline: Date;
  inspectionDeadline: Date;
  occupancyDate: Date;
  includedItemsJson: object;
  excludedItemsJson: object;
  specialConditionsJson: object;
  financingClauseText: string;
  inspectionClauseText: string;
  occupancyClauseText: string;
  priceBandsJson: {
    selected: "BALANCED";
    aggressive: number;
    balanced: number;
    safe: number;
    negotiationConfidence?: number | null;
  };
  rationaleJson: {
    fields: Record<string, FieldRationale>;
    negotiationSummary: string;
    dealScoreNote: string | null;
    closeProbabilityNote: string | null;
  };
  clauseWarningsJson: string[];
};

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function roundCad(n: number): number {
  return Math.round(n / 100) * 100;
}

function brokerDefaultDays(meta: unknown, key: string, fallback: number): number {
  if (meta && typeof meta === "object" && key in (meta as object)) {
    const v = (meta as Record<string, unknown>)[key];
    if (typeof v === "number" && v > 0 && v < 120) return Math.round(v);
  }
  return fallback;
}

/**
 * Deterministic AI assistive draft — traceable to negotiation engine, listing, clause library, and broker defaults.
 */
export function generateOfferDraftFromContext(ctx: OfferDraftContext): OfferDraftGenerated {
  const nctx = ctx.negotiationAi;
  const strategies = computeNegotiationStrategies(nctx);
  const balanced = strategies.find((s) => s.strategyType === "BALANCED") ?? strategies[1] ?? strategies[0];
  const aggressive = strategies.find((s) => s.strategyType === "AGGRESSIVE")?.suggestedPrice ?? balanced.suggestedPrice;
  const safe = strategies.find((s) => s.strategyType === "SAFE")?.suggestedPrice ?? balanced.suggestedPrice;
  const purchasePrice = roundCad(balanced.suggestedPrice);

  const depositPct = 0.05;
  const depositAmount = roundCad(purchasePrice * depositPct);

  const meta = ctx.deal.executionMetadata;
  const finDays = brokerDefaultDays(meta, "offerFinancingDays", 21);
  const insDays = brokerDefaultDays(meta, "offerInspectionDays", 14);
  const occDays = brokerDefaultDays(meta, "offerOccupancyDaysFromAcceptance", 45);

  const baseDate = new Date();
  const financingDeadline = addDays(baseDate, finDays);
  const inspectionDeadline = addDays(baseDate, insDays);
  const occupancyDate = addDays(baseDate, occDays);

  const financingClauseText = renderClauseTemplate(OFFER_CLAUSE_LIBRARY.financing.template, {
    financing_days: finDays,
  });
  const inspectionClauseText = renderClauseTemplate(OFFER_CLAUSE_LIBRARY.inspection.template, {
    inspection_days: insDays,
  });
  const occupancyClauseText = renderClauseTemplate(OFFER_CLAUSE_LIBRARY.occupancy.template, {
    occupancy_terms: `on the later of ${occupancyDate.toISOString().slice(0, 10)} or clearance of conditions, subject to notary scheduling`,
  });

  const inclusions = defaultInclusions();
  const exclusions = defaultExclusions();
  const special: { clause: string; sourceRuleId: string }[] = [
    {
      clause: renderClauseTemplate(OFFER_CLAUSE_LIBRARY.brokerDisclosure.template, {}),
      sourceRuleId: OFFER_CLAUSE_LIBRARY.brokerDisclosure.ruleId,
    },
  ];
  if (ctx.requiresConflictClause) {
    special.push({
      clause: renderClauseTemplate(OFFER_CLAUSE_LIBRARY.conflictDisclosure.template, {}),
      sourceRuleId: OFFER_CLAUSE_LIBRARY.conflictDisclosure.ruleId,
    });
  }

  const clauseWarningsJson: string[] = [];
  if (nctx.financingStrength === "weak") {
    clauseWarningsJson.push("Financing strength is weak — consider longer financing condition or lender pre-approval attachment.");
  }
  if (nctx.inspectionStress === "high") {
    clauseWarningsJson.push("Inspection stress is elevated — avoid waiving material inspection rights without counsel review.");
  }
  if ((nctx.comparableSampleSize ?? 0) < 4) {
    clauseWarningsJson.push("Comparable sample is thin — verify pricing against broker CMA before submission.");
  }
  if (!ctx.listing) {
    clauseWarningsJson.push("No CRM listing linked — inclusions/exclusions may be incomplete.");
  }

  const rationaleJson: OfferDraftGenerated["rationaleJson"] = {
    fields: {
      purchasePrice: {
        value: purchasePrice,
        sources: [
          { type: "negotiation_ai", ref: "computeNegotiationStrategies.BALANCED.suggestedPrice" },
          { type: "listing", ref: ctx.listing ? `listing.priceCad:${ctx.listing.priceCad}` : "none" },
          { type: "comparables", ref: `peerMedian:${nctx.comparableMedianCad ?? "n/a"};n:${nctx.comparableSampleSize}` },
        ],
      },
      depositAmount: {
        value: depositAmount,
        sources: [{ type: "template_rule", ref: "deposit_pct_of_purchase_5_round_100" }],
      },
      financingDeadline: {
        value: financingDeadline.toISOString(),
        sources: [
          { type: "broker_default", ref: `executionMetadata.offerFinancingDays|fallback:${finDays}` },
          { type: "clause_library", ref: OFFER_CLAUSE_LIBRARY.financing.ruleId },
        ],
      },
      inspectionDeadline: {
        value: inspectionDeadline.toISOString(),
        sources: [
          { type: "broker_default", ref: `executionMetadata.offerInspectionDays|fallback:${insDays}` },
          { type: "clause_library", ref: OFFER_CLAUSE_LIBRARY.inspection.ruleId },
        ],
      },
      occupancyDate: {
        value: occupancyDate.toISOString(),
        sources: [
          { type: "broker_default", ref: `executionMetadata.offerOccupancyDaysFromAcceptance|fallback:${occDays}` },
          { type: "clause_library", ref: OFFER_CLAUSE_LIBRARY.occupancy.ruleId },
        ],
      },
      inclusions: {
        value: inclusions,
        sources: [{ type: "clause_library", ref: "defaultInclusions" }],
      },
      exclusions: {
        value: exclusions,
        sources: [{ type: "clause_library", ref: "defaultExclusions" }],
      },
      specialConditions: {
        value: special,
        sources: [
          { type: "compliance", ref: "broker_mandatory_disclosure_clause" },
          ...(ctx.requiresConflictClause ? [{ type: "compliance", ref: "conflict_disclosure_required" }] : []),
        ],
      },
    },
    negotiationSummary: balanced.reasoningJson.summary,
    dealScoreNote:
      ctx.dealScoreSnapshot ?
        `Latest broker deal score ${ctx.dealScoreSnapshot.score} (${ctx.dealScoreSnapshot.category ?? "n/a"}).`
      : ctx.deal.dealScore != null ? `Cached deal score ${ctx.deal.dealScore}.` : null,
    closeProbabilityNote:
      ctx.deal.closeProbability != null ?
        `Close probability (file): ${Math.round(ctx.deal.closeProbability * 100) / 100}.`
      : null,
  };

  const priceBandsJson: OfferDraftGenerated["priceBandsJson"] = {
    selected: "BALANCED",
    aggressive: roundCad(aggressive),
    balanced: roundCad(balanced.suggestedPrice),
    safe: roundCad(safe),
    negotiationConfidence: balanced.confidenceScore,
  };

  return {
    purchasePrice,
    depositAmount,
    financingDeadline,
    inspectionDeadline,
    occupancyDate,
    includedItemsJson: inclusions,
    excludedItemsJson: exclusions,
    specialConditionsJson: special,
    financingClauseText,
    inspectionClauseText,
    occupancyClauseText,
    priceBandsJson,
    rationaleJson,
    clauseWarningsJson,
  };
}

/** Loads deal context and returns the assistive draft payload (does not persist). */
export async function generateOfferDraft(dealId: string): Promise<OfferDraftGenerated> {
  const ctx = await buildOfferDraftContext(dealId);
  if (!ctx) throw new Error("DEAL_NOT_FOUND");
  return generateOfferDraftFromContext(ctx);
}
