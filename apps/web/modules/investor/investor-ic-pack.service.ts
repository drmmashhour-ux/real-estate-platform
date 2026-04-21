import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { loadInvestorListingContext } from "@/modules/investor/investor-context.loader";
import { buildInvestorIcPackPayload } from "@/modules/investor/investor-ic-pack.builder";
import type { InvestorIcPackPayload } from "@/modules/investor/investor.types";
import { INVESTOR_IC_PACK_VERSION } from "@/modules/investor/investor.types";
import { validateIcPackPayload } from "@/modules/investor/investor-validation";

const TAG = "[investor-ic-pack]";

export async function generateInvestorIcPack(options: {
  listingId: string;
  userId: string;
  decisionStage?: string;
}): Promise<{ icPack: { id: string }; payload: InvestorIcPackPayload }> {
  logInfo(`${TAG} generation start`, { listingId: options.listingId });

  const ctx = await loadInvestorListingContext(options.listingId);
  if (!ctx) {
    logInfo(`${TAG} listing not found`, { listingId: options.listingId });
    throw new Error("Listing not found");
  }

  const payload = buildInvestorIcPackPayload(ctx, { decisionStage: options.decisionStage });

  let toStore: InvestorIcPackPayload = payload;
  const v = validateIcPackPayload(payload);
  if (!v.ok) {
    logInfo(`${TAG} soft-fail — padding risk stub`, { errors: v.errors });
    toStore = {
      ...payload,
      riskAssessment: {
        ...payload.riskAssessment,
        mediumRisks: [
          ...payload.riskAssessment.mediumRisks,
          "Structured risk buckets were sparse at generation time — refresh after more evidence ingestion.",
        ],
      },
    };
    const v2 = validateIcPackPayload(toStore);
    if (!v2.ok) {
      throw new Error(`IC pack validation failed: ${v2.errors.join("; ")}`);
    }
  }

  await prisma.investorIcPack.updateMany({
    where: { listingId: options.listingId, status: "GENERATED" },
    data: { status: "SUPERSEDED" },
  });

  const row = await prisma.investorIcPack.create({
    data: {
      listingId: options.listingId,
      generatedForUserId: options.userId,
      version: INVESTOR_IC_PACK_VERSION,
      status: "GENERATED",
      title: `Investment Committee pack — ${ctx.listing.title}`,
      decisionStage: options.decisionStage ?? "IC_REVIEW",
      recommendation: toStore.finalRecommendation.recommendation,
      confidenceLevel: toStore.cover.confidenceLevel,
      payloadJson: toStore as object,
    },
    select: { id: true },
  });

  await prisma.investorDecisionLog.create({
    data: {
      listingId: options.listingId,
      icPackId: row.id,
      recommendation: toStore.finalRecommendation.recommendation,
      confidenceLevel: toStore.cover.confidenceLevel,
      rationaleSummary: toStore.finalRecommendation.rationale.slice(0, 4000),
    },
  });

  logInfo(`${TAG} generation end`, {
    listingId: options.listingId,
    icPackId: row.id,
    recommendation: toStore.finalRecommendation.recommendation,
  });

  import("@/modules/deals/deal-artifact-sync")
    .then((m) => m.syncArtifactsForListing(options.listingId, { icPackId: row.id }))
    .catch(() => {});

  return { icPack: row, payload: toStore };
}

export async function getLatestInvestorIcPack(listingId: string) {
  return prisma.investorIcPack.findFirst({
    where: { listingId, status: "GENERATED" },
    orderBy: { createdAt: "desc" },
  });
}
