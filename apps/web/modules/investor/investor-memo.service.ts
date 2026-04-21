import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { loadInvestorListingContext } from "@/modules/investor/investor-context.loader";
import { buildInvestorMemoPayload, memoTitle } from "@/modules/investor/investor-memo-builder";
import type { InvestorMemoPayload, InvestorMemoType } from "@/modules/investor/investor.types";
import { INVESTOR_MEMO_VERSION } from "@/modules/investor/investor.types";
import { validateMemoPayload } from "@/modules/investor/investor-validation";

const TAG = "[investor-memo]";

export async function generateInvestorMemo(options: {
  listingId: string;
  userId: string;
  memoType: InvestorMemoType;
}): Promise<{ memo: { id: string }; payload: InvestorMemoPayload }> {
  logInfo(`${TAG} generation start`, { listingId: options.listingId, memoType: options.memoType });

  const ctx = await loadInvestorListingContext(options.listingId);
  if (!ctx) {
    logInfo(`${TAG} listing not found`, { listingId: options.listingId });
    throw new Error("Listing not found");
  }

  const payload = buildInvestorMemoPayload(ctx, options.memoType);
  const v = validateMemoPayload(payload);
  if (!v.ok) {
    logInfo(`${TAG} validation warnings`, { errors: v.errors });
    throw new Error(`Memo validation failed: ${v.errors.join("; ")}`);
  }

  await prisma.investorMemo.updateMany({
    where: { listingId: options.listingId, status: "GENERATED" },
    data: { status: "SUPERSEDED" },
  });

  const row = await prisma.investorMemo.create({
    data: {
      listingId: options.listingId,
      generatedForUserId: options.userId,
      version: INVESTOR_MEMO_VERSION,
      status: "GENERATED",
      title: memoTitle(options.memoType, ctx.listing.title),
      memoType: options.memoType,
      headlineDecision: payload.headline.shortSummary.slice(0, 4000),
      recommendation: payload.headline.recommendation,
      confidenceLevel: payload.headline.confidenceLevel,
      payloadJson: payload as object,
    },
    select: { id: true },
  });

  await prisma.investorDecisionLog.create({
    data: {
      listingId: options.listingId,
      memoId: row.id,
      recommendation: payload.headline.recommendation,
      confidenceLevel: payload.headline.confidenceLevel,
      rationaleSummary: payload.decisionTrace.rationale.slice(0, 4000),
    },
  });

  logInfo(`${TAG} generation end`, {
    listingId: options.listingId,
    memoId: row.id,
    recommendation: payload.headline.recommendation,
  });

  import("@/modules/deals/deal-artifact-sync")
    .then((m) => m.syncArtifactsForListing(options.listingId, { memoId: row.id }))
    .catch(() => {});

  return { memo: row, payload };
}

export async function getLatestInvestorMemo(listingId: string) {
  return prisma.investorMemo.findFirst({
    where: { listingId, status: "GENERATED" },
    orderBy: { createdAt: "desc" },
  });
}

export async function listInvestorMemoHistory(listingId: string, take = 20) {
  return prisma.investorMemo.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      version: true,
      status: true,
      memoType: true,
      title: true,
      recommendation: true,
      confidenceLevel: true,
      createdAt: true,
    },
  });
}
