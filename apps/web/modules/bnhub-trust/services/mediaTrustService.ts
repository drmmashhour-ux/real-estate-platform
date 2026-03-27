import { BnhubTrustStreetviewCompareStatus, BnhubTrustIdentityAuditActor } from "@prisma/client";
import { prisma } from "@/lib/db";
import { StreetViewAdapter } from "@/modules/bnhub-trust/connectors/streetViewAdapter";
import { logMediaAction } from "@/modules/bnhub-trust/services/trustDecisionAuditService";

const sv = new StreetViewAdapter();

function parsePhotoUrls(listing: { photos: unknown }): string[] {
  const p = listing.photos;
  if (Array.isArray(p)) return p.filter((x): x is string => typeof x === "string");
  return [];
}

/** Heuristic: filename or URL hints for exterior/building/facade */
function exteriorHeuristic(urls: string[]): boolean {
  const keys = ["exterior", "facade", "building", "outside", "street", "front"];
  return urls.some((u) => keys.some((k) => u.toLowerCase().includes(k)));
}

export async function upsertMediaValidation(listingId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { photos: true, nightPriceCents: true },
  });
  if (!listing) return;

  const dbPhotos = await prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    select: { url: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
    take: 24,
  });
  const urls = dbPhotos.length > 0 ? dbPhotos.map((p) => p.url) : parsePhotoUrls(listing);
  const count = urls.length;
  const coverScore = count > 0 ? Math.min(100, 40 + count * 8) : 0;
  const coverageScore = Math.min(100, count * 12);
  const exterior = exteriorHeuristic(urls);

  let streetStatus: BnhubTrustStreetviewCompareStatus = BnhubTrustStreetviewCompareStatus.NOT_RUN;
  const av = await prisma.bnhubAddressVerification.findUnique({
    where: { listingId },
    select: { latitude: true, longitude: true },
  });
  if (av?.latitude != null && av?.longitude != null) {
    const meta = await sv.fetchStreetViewMetadataIfSupported(av.latitude, av.longitude);
    if (!meta) streetStatus = BnhubTrustStreetviewCompareStatus.NO_REFERENCE;
    else if (meta.status === "OK") streetStatus = BnhubTrustStreetviewCompareStatus.NO_REFERENCE;
    else streetStatus = BnhubTrustStreetviewCompareStatus.NO_REFERENCE;
  }

  const duplicateRisk = await computeDuplicateImageRisk(listingId, urls[0] ?? null);

  await prisma.bnhubMediaTrustValidation.upsert({
    where: { listingId },
    create: {
      listingId,
      coverPhotoScore: coverScore,
      photoCoverageScore: coverageScore,
      exteriorPhotoPresent: exterior,
      duplicateImageRiskScore: duplicateRisk,
      imageConsistencyScore: Math.max(0, 100 - duplicateRisk),
      streetviewComparisonStatus: streetStatus,
      metadataJson: { photoCount: count, placeholderCompare: true },
    },
    update: {
      coverPhotoScore: coverScore,
      photoCoverageScore: coverageScore,
      exteriorPhotoPresent: exterior,
      duplicateImageRiskScore: duplicateRisk,
      imageConsistencyScore: Math.max(0, 100 - duplicateRisk),
      streetviewComparisonStatus: streetStatus,
      metadataJson: { photoCount: count, placeholderCompare: true },
    },
  });
  await logMediaAction({
    actorType: BnhubTrustIdentityAuditActor.SYSTEM,
    listingId,
    actionType: "media_validation_upsert",
    actionSummary: `Photos ${count}, exterior hint ${exterior}`,
  });
}

async function computeDuplicateImageRisk(listingId: string, primaryUrl: string | null): Promise<number> {
  if (!primaryUrl) return 0;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return 0;
  const others = await prisma.shortTermListing.findMany({
    where: { ownerId: listing.ownerId, NOT: { id: listingId } },
    select: { id: true, photos: true },
    take: 40,
  });
  let dup = 0;
  for (const o of others) {
    const urls = parsePhotoUrls(o);
    if (urls[0] === primaryUrl) dup++;
  }
  return Math.min(100, dup * 25);
}

export async function scoreCoverPhoto(listingId: string) {
  await upsertMediaValidation(listingId);
  const m = await prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } });
  return m?.coverPhotoScore ?? 0;
}

export const detectExteriorPhotoPresence = async (listingId: string) => {
  await upsertMediaValidation(listingId);
  return (await prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } }))?.exteriorPhotoPresent ?? false;
};

export const detectDuplicateImages = async (listingId: string) => {
  await upsertMediaValidation(listingId);
  return (await prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } }))?.duplicateImageRiskScore ?? 0;
};

export const scorePhotoCoverage = async (listingId: string) => {
  await upsertMediaValidation(listingId);
  return (await prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } }))?.photoCoverageScore ?? 0;
};
