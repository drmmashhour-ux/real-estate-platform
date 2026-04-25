import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { logAppraisalAudit } from "@/lib/appraisal/appraisal-audit";
import { generateAppraisalReportNumber } from "@/lib/appraisal/report-number";
import { computeIndicativeValueFromPricesCents } from "@/lib/appraisal/valuation-engine";
import { buildAppraisalReportDraft } from "@/lib/appraisal/report-draft";
import { assertAppraisalCaseReadyToFinalize } from "@/lib/appraisal/broker-review-gate";

export async function assertBrokerCanAccessListing(listingId: string, userId: string): Promise<void> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) throw new Error("LISTING_NOT_FOUND");
  if (listing.ownerId !== userId && !(await isPlatformAdmin(userId))) {
    throw new Error("FORBIDDEN");
  }
}

export async function getBrokerAppraisalCaseForUser(caseId: string, userId: string) {
  const row = await prisma.lecipmBrokerAppraisalCase.findUnique({
    where: { id: caseId },
  });
  if (!row) return null;
  if (row.brokerUserId !== userId && !(await isPlatformAdmin(userId))) {
    return null;
  }
  return row;
}

export async function createBrokerAppraisalCase(input: {
  brokerUserId: string;
  subjectListingId: string;
  title?: string | null;
}) {
  await assertBrokerCanAccessListing(input.subjectListingId, input.brokerUserId);

  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: input.subjectListingId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  let reportNumber = generateAppraisalReportNumber();
  for (let i = 0; i < 8; i++) {
    const clash = await prisma.lecipmBrokerAppraisalCase.findUnique({
      where: { reportNumber },
      select: { id: true },
    });
    if (!clash) break;
    reportNumber = generateAppraisalReportNumber();
  }

  const appraisal = await prisma.lecipmBrokerAppraisalCase.create({
    data: {
      brokerUserId: input.brokerUserId,
      subjectListingId: input.subjectListingId,
      dealAnalysisId: analysis?.id ?? null,
      title:
        input.title?.trim() ||
        `Pricing analysis — ${input.subjectListingId.slice(0, 8)}`,
      reportNumber,
    },
  });

  await logAppraisalAudit({
    actorUserId: input.brokerUserId,
    action: "appraisal_case_created",
    entityId: appraisal.id,
    summary: `Valuation support case created: ${appraisal.title}`,
  });

  return appraisal;
}

export async function updateBrokerAppraisalReviewFlags(input: {
  caseId: string;
  brokerUserId: string;
  patch: Partial<{
    comparablesReviewed: boolean;
    adjustmentsReviewed: boolean;
    assumptionsReviewed: boolean;
    conclusionReviewed: boolean;
    brokerApproved: boolean;
  }>;
}) {
  const before = await getBrokerAppraisalCaseForUser(input.caseId, input.brokerUserId);
  if (!before) throw new Error("NOT_FOUND");

  const wasSectionReviewComplete =
    before.comparablesReviewed &&
    before.adjustmentsReviewed &&
    before.assumptionsReviewed &&
    before.conclusionReviewed;

  const merged = {
    comparablesReviewed: input.patch.comparablesReviewed ?? before.comparablesReviewed,
    adjustmentsReviewed: input.patch.adjustmentsReviewed ?? before.adjustmentsReviewed,
    assumptionsReviewed: input.patch.assumptionsReviewed ?? before.assumptionsReviewed,
    conclusionReviewed: input.patch.conclusionReviewed ?? before.conclusionReviewed,
    brokerApproved: input.patch.brokerApproved ?? before.brokerApproved,
  };

  const nowSectionReviewComplete =
    merged.comparablesReviewed &&
    merged.adjustmentsReviewed &&
    merged.assumptionsReviewed &&
    merged.conclusionReviewed;

  const updated = await prisma.lecipmBrokerAppraisalCase.update({
    where: { id: input.caseId },
    data: {
      comparablesReviewed: merged.comparablesReviewed,
      adjustmentsReviewed: merged.adjustmentsReviewed,
      assumptionsReviewed: merged.assumptionsReviewed,
      conclusionReviewed: merged.conclusionReviewed,
      brokerApproved: merged.brokerApproved,
      ...(nowSectionReviewComplete && !wasSectionReviewComplete ? { reportReviewedAt: new Date() } : {}),
    },
  });

  if (nowSectionReviewComplete && !wasSectionReviewComplete) {
    await logAppraisalAudit({
      actorUserId: input.brokerUserId,
      action: "report_reviewed",
      entityId: updated.id,
      summary: "Appraisal report draft — checklist sections reviewed",
    });
  }

  return updated;
}

export async function computeAndPersistCaseValueIndication(input: { caseId: string; brokerUserId: string }) {
  const row = await getBrokerAppraisalCaseForUser(input.caseId, input.brokerUserId);
  if (!row) throw new Error("NOT_FOUND");
  if (!row.dealAnalysisId) {
    throw new Error("DEAL_ANALYSIS_REQUIRED");
  }

  const comps = await prisma.dealAnalysisComparable.findMany({
    where: { analysisId: row.dealAnalysisId },
    select: { priceCents: true },
  });
  const block = computeIndicativeValueFromPricesCents(comps.map((c) => c.priceCents));
  const median = block.medianCents;

  const updated = await prisma.lecipmBrokerAppraisalCase.update({
    where: { id: row.id },
    data: { valueIndicationCents: median },
  });

  await logAppraisalAudit({
    actorUserId: input.brokerUserId,
    action: "value_computed",
    entityId: row.id,
    summary: "Market estimate updated from comparables",
    payload: { medianCents: median, comparableCount: block.count },
  });

  return { row: updated, block };
}

export async function generateAndPersistReportDraft(input: { caseId: string; brokerUserId: string }) {
  const row = await getBrokerAppraisalCaseForUser(input.caseId, input.brokerUserId);
  if (!row) throw new Error("NOT_FOUND");

  let block = null;
  if (row.dealAnalysisId) {
    const comps = await prisma.dealAnalysisComparable.findMany({
      where: { analysisId: row.dealAnalysisId },
      select: { priceCents: true },
    });
    block = computeIndicativeValueFromPricesCents(comps.map((c) => c.priceCents));
  }

  const draft = buildAppraisalReportDraft({ title: row.title, valueBlock: block });
  const updated = await prisma.lecipmBrokerAppraisalCase.update({
    where: { id: row.id },
    data: { reportDraftJson: draft as object },
  });

  await logAppraisalAudit({
    actorUserId: input.brokerUserId,
    action: "report_created",
    entityId: row.id,
    summary: "Appraisal report draft generated",
  });

  return { row: updated, draft };
}

export async function finalizeBrokerAppraisalCase(input: { caseId: string; brokerUserId: string }) {
  const row = await getBrokerAppraisalCaseForUser(input.caseId, input.brokerUserId);
  if (!row) throw new Error("NOT_FOUND");

  assertAppraisalCaseReadyToFinalize(row);

  if (row.finalizedAt) {
    throw new Error("ALREADY_FINALIZED");
  }

  const updated = await prisma.lecipmBrokerAppraisalCase.update({
    where: { id: row.id },
    data: { finalizedAt: new Date() },
  });

  await logAppraisalAudit({
    actorUserId: input.brokerUserId,
    action: "report_finalized",
    entityId: row.id,
    summary: "Appraisal report draft finalized after broker review",
  });

  return updated;
}
