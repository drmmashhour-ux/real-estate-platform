import { prisma } from "@repo/db";
import { computeListingInvestmentRecommendation } from "@/lib/fsbo/listing-investment-recommendation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { assertBrokeredTransaction } from "@/modules/legal-boundary/compliance-action-guard";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

export const dynamic = "force-dynamic";

/** GET — rules-based investment-style label (not advice). Public when listing is visible. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const row = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      status: true,
      moderationStatus: true,
      priceCents: true,
      surfaceSqft: true,
      propertyType: true,
      riskScore: true,
      trustScore: true,
    },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!isFsboPubliclyVisible(row)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: id });
  const boundary = await assertBrokeredTransaction(txCtx, "deal_scoring_advice", null);
  if (boundary) return boundary;

  const recommendation = computeListingInvestmentRecommendation({
    riskScore: row.riskScore,
    trustScore: row.trustScore,
    priceCents: row.priceCents,
    surfaceSqft: row.surfaceSqft,
    propertyType: row.propertyType,
  });

  return Response.json({ recommendation });
}
