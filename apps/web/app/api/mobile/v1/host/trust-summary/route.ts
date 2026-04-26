import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getUserVerificationStatus } from "@/modules/bnhub-trust/services/identityVerificationService";
import { BNHUB_TRUST_SAFE_COPY } from "@/modules/bnhub-trust/lib/safeCopy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });
  if (listings.length === 0) return Response.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const pickId = url.searchParams.get("listingId")?.trim();
  const primary = pickId ? listings.find((l) => l.id === pickId) ?? listings[0] : listings[0];
  const idv = await getUserVerificationStatus(userId);
  const engine = await prisma.bnhubListingTrustRiskProfile.findUnique({
    where: { listingId: primary.id },
    select: {
      trustStatus: true,
      payoutRestrictionStatus: true,
      promotionEligibilityStatus: true,
      overallRiskLevel: true,
    },
  });
  const media = await prisma.bnhubMediaTrustValidation.findUnique({
    where: { listingId: primary.id },
    select: { exteriorPhotoPresent: true },
  });
  const engines = await prisma.bnhubListingTrustRiskProfile.findMany({
    where: { listingId: { in: listings.map((l) => l.id) } },
    select: {
      listingId: true,
      trustStatus: true,
      payoutRestrictionStatus: true,
      promotionEligibilityStatus: true,
    },
  });
  const engById = new Map(engines.map((e) => [e.listingId, e]));
  return Response.json({
    verificationStatus: idv?.verificationStatus ?? "NOT_STARTED",
    verificationSummary: idv?.resultSummary ?? BNHUB_TRUST_SAFE_COPY.verificationIncomplete,
    primaryListingId: primary.id,
    trustStatus: engine?.trustStatus ?? "TRUSTED",
    payoutNote:
      engine?.payoutRestrictionStatus && engine.payoutRestrictionStatus !== "NONE"
        ? BNHUB_TRUST_SAFE_COPY.payoutHoldGeneric
        : null,
    promotionNote:
      engine?.promotionEligibilityStatus === "BLOCKED" || engine?.promotionEligibilityStatus === "REVIEW_REQUIRED"
        ? BNHUB_TRUST_SAFE_COPY.promotionBlocked
        : null,
    exteriorPhotoOk: media?.exteriorPhotoPresent ?? false,
    exteriorHint: media?.exteriorPhotoPresent ? null : BNHUB_TRUST_SAFE_COPY.missingExteriorPhoto,
    listings: listings.map((l) => {
      const e = engById.get(l.id);
      return {
        listingId: l.id,
        title: l.title,
        trustStatus: e?.trustStatus ?? "TRUSTED",
        payoutRestricted: Boolean(e?.payoutRestrictionStatus && e.payoutRestrictionStatus !== "NONE"),
        promotionLimited:
          e?.promotionEligibilityStatus === "BLOCKED" || e?.promotionEligibilityStatus === "REVIEW_REQUIRED",
      };
    }),
    safeCopy: BNHUB_TRUST_SAFE_COPY,
  });
}
