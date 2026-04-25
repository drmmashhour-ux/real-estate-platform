import { prisma } from "@/lib/db";
import { buildAutoAdjustmentPrompt } from "@/lib/ai/auto-adjustments";
import { computeComparableDifferences } from "@/lib/appraisal/differences";
import { generateBaseAdjustmentSuggestions } from "@/lib/appraisal/base-adjustments";
import { runAutoAdjustmentModel } from "@/lib/appraisal/auto-adjustment-ai";
import { mergeAssumptions, buildValuationRecordFromListing } from "@/lib/appraisal/valuation-records";
import { logAppraisalAdjustmentAudit } from "@/lib/appraisal/adjustment-audit";

export type GenerateAutoAdjustmentsInput = {
  appraisalCaseId: string;
  comparableId: string;
  actorUserId?: string | null;
};

function trimRationale(s: string | null | undefined, max = 8000): string | null {
  if (s == null) return null;
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export async function generateAutoAdjustments(input: GenerateAutoAdjustmentsInput) {
  const analysis = await prisma.dealAnalysis.findUnique({
    where: { id: input.appraisalCaseId },
    include: { comparables: true },
  });

  if (!analysis) {
    throw new Error("APPRAISAL_CASE_NOT_FOUND");
  }

  const comparableRow = analysis.comparables.find((c) => c.id === input.comparableId);
  if (!comparableRow) {
    throw new Error("COMPARABLE_NOT_FOUND");
  }

  if (!analysis.propertyId) {
    throw new Error("SUBJECT_LISTING_NOT_LINKED");
  }

  const [subjectListing, compListing] = await Promise.all([
    prisma.fsboListing.findUnique({
      where: { id: analysis.propertyId },
      select: {
        id: true,
        address: true,
        city: true,
        priceCents: true,
        surfaceSqft: true,
        bedrooms: true,
        bathrooms: true,
        yearBuilt: true,
        propertyType: true,
        sellerDeclarationJson: true,
      },
    }),
    prisma.fsboListing.findUnique({
      where: { id: comparableRow.comparablePropertyId },
      select: {
        id: true,
        address: true,
        city: true,
        priceCents: true,
        surfaceSqft: true,
        bedrooms: true,
        bathrooms: true,
        yearBuilt: true,
        propertyType: true,
        sellerDeclarationJson: true,
      },
    }),
  ]);

  if (!subjectListing || !compListing) {
    throw new Error("LISTING_DATA_NOT_FOUND");
  }

  const summary =
    analysis.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const assumptions =
    typeof summary.assumptions === "object" && summary.assumptions != null
      ? (summary.assumptions as Record<string, unknown>)
      : undefined;

  let subject = buildValuationRecordFromListing(subjectListing, "subject");
  subject = mergeAssumptions(subject, assumptions);

  const compBase = buildValuationRecordFromListing(compListing, "comparable");
  const comparableRecord = {
    ...compBase,
    salePriceCents: comparableRow.priceCents,
    buildingAreaSqft: comparableRow.areaSqft ?? compBase.buildingAreaSqft,
    bedrooms: comparableRow.bedrooms ?? compBase.bedrooms,
    bathrooms: comparableRow.bathrooms ?? compBase.bathrooms,
    comparableRowId: comparableRow.id,
    analysisComparablePriceCents: comparableRow.priceCents,
  };

  const differences = computeComparableDifferences({ subject, comparable: comparableRecord });

  const ruleBasedSuggestions = generateBaseAdjustmentSuggestions({
    differences,
    comparable: comparableRecord,
  });

  await prisma.appraisalAdjustmentProposal.deleteMany({
    where: {
      appraisalCaseId: analysis.id,
      comparableId: comparableRow.id,
      reviewed: false,
    },
  });

  const createdRule: Awaited<ReturnType<typeof prisma.appraisalAdjustmentProposal.create>>[] = [];
  for (const r of ruleBasedSuggestions) {
    const row = await prisma.appraisalAdjustmentProposal.create({
      data: {
        appraisalCaseId: analysis.id,
        comparableId: comparableRow.id,
        adjustmentType: r.adjustmentType,
        label: r.label,
        suggestedAmountCents: r.suggestedAmountCents,
        direction: r.direction,
        rationale: r.rationale,
        confidence: r.confidence,
        sourceType: r.sourceType,
        sourceSummary: { differences, phase: "rule_engine" },
      },
    });
    createdRule.push(row);
    await logAppraisalAdjustmentAudit({
      actorUserId: input.actorUserId,
      action: "proposal_generated",
      entityId: row.id,
      payload: { sourceType: r.adjustmentType, kind: "rule_engine" },
    });
  }

  const prompt = buildAutoAdjustmentPrompt({
    subject,
    comparable: comparableRecord,
    differences,
    ruleBasedSuggestions,
  });

  const ai = await runAutoAdjustmentModel(prompt);
  const createdAi: typeof createdRule = [];

  for (const suggestion of ai.adjustments ?? []) {
    const row = await prisma.appraisalAdjustmentProposal.create({
      data: {
        appraisalCaseId: analysis.id,
        comparableId: comparableRow.id,
        adjustmentType: suggestion.adjustmentType,
        label: suggestion.label,
        suggestedAmountCents: suggestion.suggestedAmountCents,
        direction: suggestion.direction,
        rationale: trimRationale(suggestion.rationale),
        confidence: suggestion.confidence,
        sourceType: suggestion.sourceType ?? "ai_assist",
        sourceSummary: {
          differences,
          ruleBasedSuggestions,
          aiSummary: ai.summary ?? null,
          warnings: ai.warnings ?? [],
        },
      },
    });
    createdAi.push(row);
    await logAppraisalAdjustmentAudit({
      actorUserId: input.actorUserId,
      action: "proposal_generated",
      entityId: row.id,
      payload: { sourceType: suggestion.adjustmentType, kind: "ai_assist" },
    });
  }

  return {
    differences,
    ruleBasedSuggestions,
    aiSummary: ai.summary ?? null,
    warnings: ai.warnings ?? [],
    created: [...createdRule, ...createdAi],
  };
}
