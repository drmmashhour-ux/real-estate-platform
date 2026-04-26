import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphInvestorFiltersEnabled } from "@/lib/trustgraph/feature-flags";
import { classifyVerifiedOpportunity } from "@/lib/trustgraph/infrastructure/services/verifiedOpportunityService";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { listingStatusParamsSchema } from "@/lib/trustgraph/infrastructure/validation/listingStatusParamsSchema";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphInvestorFiltersEnabled()) {
    return trustgraphJsonError("Investor TrustGraph filters disabled", 503);
  }

  const raw = await context.params;
  const parsed = listingStatusParamsSchema.safeParse({ listingId: raw.listingId });
  if (!parsed.success) {
    return trustgraphJsonError("Invalid listing id", 400, parsed.error.flatten());
  }

  const userId = await getGuestId();
  if (!userId) {
    return trustgraphJsonError("Unauthorized", 401);
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, status: true, moderationStatus: true },
  });
  if (!listing || listing.status !== "ACTIVE" || listing.moderationStatus !== "APPROVED") {
    return trustgraphJsonError("Not found", 404);
  }

  const admin = await isPlatformAdmin(userId);

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: listing.id },
    orderBy: { updatedAt: "desc" },
    select: { overallScore: true, trustLevel: true, readinessLevel: true },
  });

  const classification = classifyVerifiedOpportunity({ caseRow: c });

  if (classification.isVerifiedOpportunity) {
    captureServerEvent(userId, AnalyticsEvents.DEAL_FLAGGED_AS_OPPORTUNITY, {
      listingId: parsed.data.listingId,
    });
  }

  return trustgraphJsonOk({
    safe: {
      filterTags: classification.filterTags,
      isVerifiedOpportunity: classification.isVerifiedOpportunity,
    },
    ...(admin
      ? {
          internal: {
            internalCodes: classification.internalCodes,
          },
        }
      : {}),
  });
}
