import { prisma } from "@/lib/db";
import { VerificationStatus } from "@prisma/client";
import {
  selectMarketingAngle,
  type ListingMarketingInput,
} from "./marketingAIService";

export type ReadinessBreakdown = {
  photoCount: number;
  hasExteriorHint: boolean;
  descriptionChars: number;
  amenityCount: number;
  verified: boolean;
  priceSane: boolean;
};

const WEIGHTS = {
  photos: 0.22,
  exterior: 0.08,
  description: 0.2,
  amenities: 0.12,
  trust: 0.18,
  pricing: 0.12,
  bookingSettings: 0.08,
};

function photoScore(count: number, hasExteriorHint: boolean): number {
  let s = Math.min(100, count * 18);
  if (count >= 5) s = Math.min(100, s + 10);
  if (hasExteriorHint) s = Math.min(100, s + 15);
  return Math.round(s);
}

function descriptionScore(chars: number): number {
  if (chars >= 400) return 100;
  if (chars >= 200) return 75;
  if (chars >= 80) return 50;
  return Math.round((chars / 80) * 50);
}

function listingQualityFromParts(parts: ReadinessBreakdown): number {
  const p =
    photoScore(parts.photoCount, parts.hasExteriorHint) * WEIGHTS.photos +
    (parts.hasExteriorHint ? 100 : 40) * WEIGHTS.exterior +
    descriptionScore(parts.descriptionChars) * WEIGHTS.description +
    Math.min(100, parts.amenityCount * 12) * WEIGHTS.amenities +
    (parts.verified ? 100 : 45) * WEIGHTS.trust +
    (parts.priceSane ? 100 : 55) * WEIGHTS.pricing +
    85 * WEIGHTS.bookingSettings;
  return Math.round(Math.min(100, p));
}

export function computeReadinessFromListingRow(row: {
  title: string;
  description: string | null;
  photos: unknown;
  amenities: unknown;
  nightPriceCents: number;
  verificationStatus: VerificationStatus | string;
  minStayNights: number | null;
  maxStayNights: number | null;
  instantBookEnabled: boolean;
}): ReadinessBreakdown & {
  listingQualityScore: number;
  photoQualityScore: number;
  descriptionQualityScore: number;
  trustScore: number;
  pricingScore: number;
  marketFitScore: number;
  readinessScore: number;
  recommendedAngle: string;
  missingItems: string[];
  aiSummary: string;
} {
  const photos = Array.isArray(row.photos) ? row.photos.filter((x): x is string => typeof x === "string") : [];
  const amenities = Array.isArray(row.amenities)
    ? row.amenities.filter((x): x is string => typeof x === "string")
    : [];
  const desc = row.description ?? "";
  const exteriorHint = photos.some((url) => /exterior|facade|outside|street/i.test(url));
  const verified = row.verificationStatus === VerificationStatus.VERIFIED;
  const priceSane = row.nightPriceCents >= 1500 && row.nightPriceCents <= 500_000;

  const photoQualityScore = photoScore(photos.length, exteriorHint);
  const descriptionQualityScore = descriptionScore(desc.length);
  const trustScore = verified ? 92 : 48;
  const pricingScore = priceSane ? 88 : 52;
  const marketFitScore = Math.round((photoQualityScore + descriptionQualityScore + trustScore) / 3);

  const input: ListingMarketingInput = {
    title: row.title,
    city: "",
    description: row.description,
    propertyType: null,
    roomType: null,
    nightPriceCents: row.nightPriceCents,
    maxGuests: 4,
    beds: 1,
    baths: 1,
    amenities: row.amenities,
    verificationStatus: row.verificationStatus,
    minStayNights: row.minStayNights,
    maxStayNights: row.maxStayNights,
    listingCode: null,
  };
  const angle = selectMarketingAngle({ ...input, city: "market", title: row.title });

  const parts: ReadinessBreakdown = {
    photoCount: photos.length,
    hasExteriorHint: exteriorHint,
    descriptionChars: desc.length,
    amenityCount: amenities.length,
    verified,
    priceSane,
  };

  const listingQualityScore = listingQualityFromParts(parts);
  const readinessScore = Math.round(
    listingQualityScore * 0.45 +
      photoQualityScore * 0.2 +
      descriptionQualityScore * 0.15 +
      trustScore * 0.15 +
      pricingScore * 0.05
  );

  const missing: string[] = [];
  if (photos.length < 4) missing.push("Add at least 4 high-quality photos");
  if (!exteriorHint) missing.push("Add a cover or exterior image for trust");
  if (desc.length < 200) missing.push("Expand description (target 200+ characters)");
  if (!verified) missing.push("Complete BNHUB listing verification");
  if (!row.instantBookEnabled) missing.push("Consider enabling instant book for conversion tests");
  if (amenities.length < 3) missing.push("Add more amenity tags");

  const aiSummary = `Angle: ${angle}. Readiness ${readinessScore}/100. ${missing.length ? `Gaps: ${missing.slice(0, 3).join("; ")}` : "Listing is promotion-ready."}`;

  return {
    ...parts,
    listingQualityScore,
    photoQualityScore,
    descriptionQualityScore,
    trustScore,
    pricingScore,
    marketFitScore,
    readinessScore,
    recommendedAngle: angle,
    missingItems: missing,
    aiSummary,
  };
}

export async function refreshListingReadiness(listingId: string) {
  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      description: true,
      photos: true,
      amenities: true,
      nightPriceCents: true,
      verificationStatus: true,
      minStayNights: true,
      maxStayNights: true,
      instantBookEnabled: true,
      city: true,
      propertyType: true,
      roomType: true,
      maxGuests: true,
      beds: true,
      baths: true,
      listingCode: true,
    },
  });
  if (!row) throw new Error("Listing not found");

  const fullInput: ListingMarketingInput = {
    title: row.title,
    city: row.city,
    description: row.description,
    propertyType: row.propertyType,
    roomType: row.roomType,
    nightPriceCents: row.nightPriceCents,
    maxGuests: row.maxGuests,
    beds: row.beds,
    baths: row.baths,
    amenities: row.amenities,
    verificationStatus: row.verificationStatus,
    minStayNights: row.minStayNights,
    maxStayNights: row.maxStayNights,
    listingCode: row.listingCode,
  };
  const angle = selectMarketingAngle(fullInput);

  const extended = computeReadinessFromListingRow({
    title: row.title,
    description: row.description,
    photos: row.photos,
    amenities: row.amenities,
    nightPriceCents: row.nightPriceCents,
    verificationStatus: row.verificationStatus,
    minStayNights: row.minStayNights,
    maxStayNights: row.maxStayNights,
    instantBookEnabled: row.instantBookEnabled,
  });
  // Override angle with full context
  const readinessScore = extended.readinessScore;

  return prisma.bnhubListingMarketingProfile.upsert({
    where: { listingId },
    create: {
      listingId,
      listingQualityScore: extended.listingQualityScore,
      photoQualityScore: extended.photoQualityScore,
      descriptionQualityScore: extended.descriptionQualityScore,
      trustScore: extended.trustScore,
      pricingScore: extended.pricingScore,
      marketFitScore: extended.marketFitScore,
      readinessScore,
      recommendedAngle: angle,
      recommendedLanguagesJson: ["en", "fr"],
      recommendedChannelsJson: [
        { code: "internal_homepage", reason: "High trust internal surface" },
        { code: "internal_search_boost", reason: "Capped boost when approved" },
      ],
      missingItemsJson: extended.missingItems,
      aiSummary: extended.aiSummary,
    },
    update: {
      listingQualityScore: extended.listingQualityScore,
      photoQualityScore: extended.photoQualityScore,
      descriptionQualityScore: extended.descriptionQualityScore,
      trustScore: extended.trustScore,
      pricingScore: extended.pricingScore,
      marketFitScore: extended.marketFitScore,
      readinessScore,
      recommendedAngle: angle,
      recommendedLanguagesJson: ["en", "fr"],
      recommendedChannelsJson: [
        { code: "internal_homepage", reason: "High trust internal surface" },
        { code: "internal_search_boost", reason: "Capped boost when approved" },
      ],
      missingItemsJson: extended.missingItems,
      aiSummary: extended.aiSummary,
    },
  });
}

export async function getListingMarketingProfile(listingId: string) {
  let p = await prisma.bnhubListingMarketingProfile.findUnique({ where: { listingId } });
  if (!p) p = await refreshListingReadiness(listingId);
  return p;
}

export async function listRecommendationsForListing(listingId: string) {
  return prisma.bnhubMarketingRecommendation.findMany({
    where: { listingId, status: "OPEN" },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}
