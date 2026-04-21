import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { loadInvestorListingContext } from "@/modules/investor/investor-context.loader";
import {
  LENDER_PACKAGE_VERSION,
  type LenderPackagePayload,
} from "@/modules/capital/capital.types";
import { appendCapitalAudit } from "@/modules/capital/capital-audit";
import { dealEligibleForCapitalStack } from "@/modules/capital/capital-policy";

const TAG = "[lender-package]";

export function assertMinimumDealContextForLenderPackage(deal: {
  title: string;
  listingId: string | null;
  latestMemoId: string | null;
  latestIcPackId: string | null;
}): void {
  if (!deal.title?.trim()) throw new Error("Deal title required for lender package.");
  if (!deal.listingId) throw new Error("Deal must be linked to a listing for lender package generation.");
  if (!deal.latestMemoId || !deal.latestIcPackId) {
    throw new Error("Latest investor memo and IC pack must be present before generating a lender package.");
  }
}

export async function buildLenderPackagePayload(pipelineDealId: string): Promise<LenderPackagePayload> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: pipelineDealId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          listingCode: true,
        },
      },
      latestMemo: { select: { id: true, title: true, payloadJson: true } },
      latestIcPack: { select: { id: true, title: true, version: true, payloadJson: true } },
      capitalStack: true,
      financingConditions: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        select: { title: true, priority: true, category: true },
        take: 40,
      },
      diligenceTasks: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        select: { title: true, category: true, priority: true },
        take: 30,
      },
    },
  });

  if (!deal) throw new Error("Deal not found");
  assertMinimumDealContextForLenderPackage(deal);

  const ctx = await loadInvestorListingContext(deal.listingId!);

  const stack = deal.capitalStack;
  const stackSummary =
    stack ?
      [
        stack.strategyType ? `Strategy: ${stack.strategyType}` : null,
        stack.totalCapitalRequired != null ?
          `Total capital (planning): ${stack.totalCapitalRequired}`
        : null,
        stack.seniorDebtTarget != null ? `Senior debt target: ${stack.seniorDebtTarget}` : null,
        stack.mezzanineTarget != null ? `Mezzanine target: ${stack.mezzanineTarget}` : null,
        stack.preferredEquityTarget != null ? `Preferred equity target: ${stack.preferredEquityTarget}` : null,
        stack.commonEquityTarget != null ? `Common equity target: ${stack.commonEquityTarget}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Capital stack not finalized — targets may be illustrative only.";

  const memoPayload = deal.latestMemo?.payloadJson as Record<string, unknown> | undefined;
  const icPayload = deal.latestIcPack?.payloadJson as Record<string, unknown> | undefined;

  const execSummaryMemo =
    typeof memoPayload?.executiveSummary === "string" ?
      memoPayload.executiveSummary
    : deal.headlineRecommendation ?? "";

  const assetOverview: Record<string, unknown> = {
    listingCode: deal.listing?.listingCode ?? null,
    listingTitle: deal.listing?.title ?? deal.title,
    listingPrice:
      deal.listing?.price != null ?
        {
          value: deal.listing.price,
          verified: true,
          source: "CRM listing row",
        }
      : { value: null, verified: false, source: "missing" },
    city: ctx?.city ?? null,
    province: ctx?.province ?? null,
    yearBuilt: ctx?.yearBuilt ?? null,
    retrofitPlanSummary: ctx?.retrofitPlan?.summaryText ?? null,
    retrofitCostBand: ctx?.retrofitPlan?.totalEstimatedCostBand ?? null,
    financingMatcherHighlights:
      ctx?.financingOptions?.slice(0, 6).map((f) => ({
        name: f.name,
        type: f.financingType,
        estimated: true,
      })) ?? [],
  };

  const esg = ctx?.esgProfile;
  const verifiedEsg =
    (esg?.evidenceConfidence ?? 0) >= 50 && (esg?.dataCoveragePercent ?? 0) >= 35;

  const criticalConditions = deal.financingConditions
    .filter((c) => c.priority === "CRITICAL")
    .map((c) => c.title);

  const completedDiligence = await prisma.investmentPipelineDiligenceTask.count({
    where: { dealId: pipelineDealId, status: "COMPLETE" },
  });

  const payload: LenderPackagePayload = {
    schemaVersion: LENDER_PACKAGE_VERSION,
    generatedAt: new Date().toISOString(),
    cover: {
      dealTitle: deal.title,
      date: new Date().toISOString().slice(0, 10),
      requestedFinancingType: stack?.strategyType ? `${stack.strategyType} capital stack` : "Senior / structured debt (TBD)",
      targetCapitalStackSummary: stackSummary,
    },
    executiveSummary: {
      shortNarrative:
        execSummaryMemo ||
        "Executive narrative unavailable — populate investor memo before lender outreach.",
      recommendation: deal.headlineRecommendation ?? "See IC pack recommendation.",
      confidenceLevel: deal.confidenceLevel ?? icPayload?.confidenceLevel?.toString() ?? "TBD",
    },
    assetOverview,
    financingRequest: {
      capitalRequired: stack?.totalCapitalRequired ?? deal.listing?.price ?? null,
      targetStructure: stackSummary,
      purposeOfFunds: "Acquisition / repositioning per investment case (see memo & IC pack).",
      requestedTermsNotes:
        "Terms subject to lender underwriting — figures below are planning estimates unless marked verified.",
    },
    investmentCase: {
      strengths:
        Array.isArray(memoPayload?.strengths) ?
          (memoPayload?.strengths as string[]).slice(0, 12)
        : [],
      mitigants:
        Array.isArray(memoPayload?.risks) ?
          (memoPayload?.risks as string[]).slice(0, 12)
        : [],
      strategicPositioning: [
        ctx?.optimizerPlan?.headlineRecommendation ?? "",
        ctx?.investmentOpportunity?.rationaleJson ?
          "Quant opportunity model attached in internal systems."
        : "",
      ].filter(Boolean),
    },
    esgSection: {
      score:
        esg?.compositeScore != null ?
          `${esg.compositeScore.toFixed(1)} (composite)`
        : "Not scored",
      confidence:
        esg?.evidenceConfidence != null ? `${esg.evidenceConfidence}%` : "Unknown",
      evidenceStrength:
        verifiedEsg ? "Stronger verified coverage" : "Mixed / estimated — expand evidence set",
      retrofitPlan: ctx?.retrofitPlan?.planName ?? "See ESG retrofit planner output",
      financingRelevance:
        ctx?.retrofitScenarioLatest?.financingFit ??
        "Green / retrofit-linked financing may apply — confirm with lender programs.",
    },
    diligenceStatus: {
      completedItems: [`${completedDiligence} diligence tasks marked complete (pipeline)`],
      openItems: deal.diligenceTasks.map((t) => `${t.title} (${t.category})`),
      criticalConditions,
    },
    appendices: {
      memoReference: deal.latestMemo?.id ?? null,
      icPackReference: deal.latestIcPack?.id ?? null,
      evidenceSummary: `ESG documents: ${ctx?.evidenceCounts.documents ?? 0}; evidence rows: ${ctx?.evidenceCounts.evidenceRows ?? 0}`,
      versions: [
        `memo:${deal.latestMemo?.title ?? "n/a"}`,
        `ic:${deal.latestIcPack?.title ?? "n/a"}@${deal.latestIcPack?.version ?? ""}`,
      ],
    },
    disclaimers: {
      verifiedVsEstimated:
        "Sections sourced from CRM listing row and verified ESG docs are labeled in-body. Modeled splits and matcher outputs are planning estimates.",
      lenderSafe:
        "Confidential — for qualified counterparties only. Not an offer to lend or solicit securities.",
    },
  };

  return payload;
}

export async function generateAndStoreLenderPackage(options: {
  pipelineDealId: string;
  actorUserId: string;
  title?: string;
}): Promise<{ id: string; payload: LenderPackagePayload }> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: options.pipelineDealId },
    select: {
      title: true,
      listingId: true,
      latestMemoId: true,
      latestIcPackId: true,
      pipelineStage: true,
      decisionStatus: true,
    },
  });
  if (!deal) throw new Error("Deal not found");

  if (!dealEligibleForCapitalStack(deal)) {
    throw new Error("Lender package generation requires an approved / eligible pipeline stage.");
  }

  assertMinimumDealContextForLenderPackage(deal);

  const payload = await buildLenderPackagePayload(options.pipelineDealId);

  const version = `${new Date().toISOString().slice(0, 10)}-${LENDER_PACKAGE_VERSION}`;

  const row = await prisma.investmentPipelineLenderPackage.create({
    data: {
      pipelineDealId: options.pipelineDealId,
      version,
      status: "GENERATED",
      title: options.title ?? `Lender package · ${deal.title}`,
      payloadJson: payload as object,
      createdByUserId: options.actorUserId,
    },
    select: { id: true },
  });

  await prisma.investmentPipelineLenderPackage.updateMany({
    where: {
      pipelineDealId: options.pipelineDealId,
      id: { not: row.id },
      status: "GENERATED",
    },
    data: { status: "SUPERSEDED", updatedAt: new Date() },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "PACKAGE_GENERATED",
    note: row.id,
    metadataJson: { version },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, packageId: row.id });

  return { id: row.id, payload };
}

export async function getLatestLenderPackage(pipelineDealId: string) {
  return prisma.investmentPipelineLenderPackage.findFirst({
    where: { pipelineDealId },
    orderBy: { createdAt: "desc" },
  });
}
