import {
  BnhubFraudFlagStatus,
  BnhubFraudSeverity,
  BnhubLuxuryEligibilityStatus,
  BnhubLuxuryTierCode,
  BnhubTrustProfileStatus,
  BnhubTrustRiskLevel,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { MIN_LISTING_PHOTOS_FOR_VERIFICATION } from "@/lib/bnhub/moderation-requirements";
import { logTierDecision } from "./trustAuditService";

export function evaluateVerifiedEligibility(input: {
  starRating: number;
  trustScore: number;
  photoCount: number;
  verificationOk: boolean;
  openCriticalFraud: boolean;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.starRating < 3) reasons.push("BNHUB internal star estimate is below 3 — improve listing quality.");
  if (input.trustScore < 45) reasons.push("Trust score is below the Verified threshold.");
  if (input.photoCount < MIN_LISTING_PHOTOS_FOR_VERIFICATION) {
    reasons.push(
      `At least ${MIN_LISTING_PHOTOS_FOR_VERIFICATION} photos are required for BNHUB Verified.`
    );
  }
  if (!input.verificationOk) reasons.push("Listing verification should be completed where supported.");
  if (input.openCriticalFraud) reasons.push("Resolve critical trust flags before Verified.");
  return { ok: reasons.length === 0, reasons };
}

export function evaluatePremiumEligibility(input: {
  starRating: number;
  trustScore: number;
  visualScore: number;
  openMediumPlusFraud: boolean;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.starRating < 4) reasons.push("Premium typically requires a 4★+ internal estimate.");
  if (input.trustScore < 62) reasons.push("Trust score should be stronger for Premium.");
  if (input.visualScore < 55) reasons.push("Photo coverage / visual signals should improve for Premium.");
  if (input.openMediumPlusFraud) reasons.push("Resolve open medium-or-higher fraud flags for Premium.");
  return { ok: reasons.length === 0, reasons };
}

export function evaluateEliteEligibility(input: {
  starRating: number;
  overallScore: number;
  trustScore: number;
  luxurySignalsStrong: boolean;
  openUnresolvedRisk: boolean;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.starRating < 5 && input.overallScore < 88) {
    reasons.push("Elite requires 5★ internal estimate or a very high overall classification score.");
  }
  if (input.trustScore < 78) reasons.push("Elite requires a high trust score.");
  if (!input.luxurySignalsStrong) reasons.push("Add stronger luxury amenity and design signals for Elite consideration.");
  if (input.openUnresolvedRisk) reasons.push("Elite requires no unresolved high-severity trust issues.");
  reasons.push("Elite may require manual admin review even when automated checks pass.");
  const scoreOk = input.starRating >= 5 || input.overallScore >= 88;
  const ok =
    scoreOk &&
    input.trustScore >= 78 &&
    input.luxurySignalsStrong &&
    !input.openUnresolvedRisk;
  return { ok, reasons };
}

export function getTierUpgradeSuggestions(input: {
  tierCode: BnhubLuxuryTierCode;
  verified: { ok: boolean; reasons: string[] };
  premium: { ok: boolean; reasons: string[] };
  elite: { ok: boolean; reasons: string[] };
}): string[] {
  const s = new Set<string>();
  if (input.tierCode === BnhubLuxuryTierCode.NONE || input.tierCode === BnhubLuxuryTierCode.VERIFIED) {
    input.verified.reasons.forEach((r) => s.add(r));
    s.add("Add exterior photos and complete safety amenities to improve Verified eligibility.");
  }
  if (input.tierCode !== BnhubLuxuryTierCode.ELITE) {
    input.premium.reasons.forEach((r) => s.add(r));
    s.add("Add bathtub, dedicated workspace, and self check-in details to improve Premium signals.");
  }
  input.elite.reasons.forEach((r) => s.add(r));
  return [...s].slice(0, 14);
}

export async function suspendTierIfTrustDrops(listingId: string): Promise<void> {
  const [trust, tier] = await Promise.all([
    prisma.bnhubTrustProfile.findUnique({ where: { listingId } }),
    prisma.bnhubLuxuryTier.findUnique({ where: { listingId } }),
  ]);
  if (!tier || !trust) return;
  if (trust.overallRiskLevel === BnhubTrustRiskLevel.CRITICAL || trust.status === BnhubTrustProfileStatus.BLOCKED) {
    await prisma.bnhubLuxuryTier.update({
      where: { listingId },
      data: { eligibilityStatus: BnhubLuxuryEligibilityStatus.SUSPENDED, notes: "Suspended automatically due to trust risk." },
    });
    await logTierDecision(listingId, { action: "suspend_tier", listingId });
  }
}

export async function getLuxuryTierByListing(listingId: string) {
  return prisma.bnhubLuxuryTier.findUnique({ where: { listingId } });
}

export async function computeLuxuryTier(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: { listingPhotos: { select: { url: true } } },
  });
  if (!listing) return;

  const [classification, trust, fraudOpen, hostQ] = await Promise.all([
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId } }),
    prisma.bnhubTrustProfile.findUnique({ where: { listingId } }),
    prisma.bnhubFraudFlag.findMany({
      where: {
        listingId,
        status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] },
      },
    }),
    prisma.bnhubHostQualityProfile.findUnique({ where: { hostUserId: listing.ownerId } }),
  ]);

  const starRating = classification?.starRating ?? 1;
  const overallScore = classification?.overallScore ?? 0;
  const trustScore = trust?.trustScore ?? 35;
  const photoUrls = [
    ...(Array.isArray(listing.photos) ? listing.photos.filter((x): x is string => typeof x === "string") : []),
    ...listing.listingPhotos.map((p) => p.url),
  ];
  const uniquePhotos = new Set(photoUrls.map((u) => u.split("?")[0])).size;
  const visualScore = trust?.photoAuthenticityScore ?? 40;

  const openCritical = fraudOpen.some((f) => f.severity === BnhubFraudSeverity.CRITICAL);
  const openMediumPlus = fraudOpen.some(
    (f) =>
      f.severity === BnhubFraudSeverity.MEDIUM ||
      f.severity === BnhubFraudSeverity.HIGH ||
      f.severity === BnhubFraudSeverity.CRITICAL
  );
  const openUnresolvedRisk = fraudOpen.some(
    (f) => f.severity === BnhubFraudSeverity.HIGH || f.severity === BnhubFraudSeverity.CRITICAL
  );

  const verificationOk = listing.verificationStatus === VerificationStatus.VERIFIED;

  const verified = evaluateVerifiedEligibility({
    starRating,
    trustScore,
    photoCount: uniquePhotos,
    verificationOk,
    openCriticalFraud: openCritical,
  });
  const premium = evaluatePremiumEligibility({
    starRating,
    trustScore,
    visualScore,
    openMediumPlusFraud: openMediumPlus,
  });
  const luxurySignalsStrong = (classification?.luxuryScore ?? 0) >= 7 && starRating >= 4;
  const elite = evaluateEliteEligibility({
    starRating,
    overallScore,
    trustScore,
    luxurySignalsStrong,
    openUnresolvedRisk,
  });

  let tierCode: BnhubLuxuryTierCode = BnhubLuxuryTierCode.NONE;
  let eligibility: BnhubLuxuryEligibilityStatus = BnhubLuxuryEligibilityStatus.INELIGIBLE;

  if (elite.ok) {
    tierCode = BnhubLuxuryTierCode.ELITE;
    eligibility = BnhubLuxuryEligibilityStatus.REVIEW_REQUIRED;
  } else if (premium.ok) {
    tierCode = BnhubLuxuryTierCode.PREMIUM;
    eligibility = BnhubLuxuryEligibilityStatus.ELIGIBLE;
  } else if (verified.ok) {
    tierCode = BnhubLuxuryTierCode.VERIFIED;
    eligibility = BnhubLuxuryEligibilityStatus.ELIGIBLE;
  }

  const responsiveness = hostQ?.responsivenessScore ?? 50;
  const tierScore = Math.round(
    starRating * 10 + trustScore * 0.35 + visualScore * 0.25 + responsiveness * 0.2 + (classification?.overallScore ?? 0) * 0.15
  );

  const breakdown = {
    verified,
    premium,
    elite,
    labels: {
      star: "BNHUB Star Rating (internal platform estimate)",
      tier: "BNHUB Luxury Tier (internal)",
    },
  };

  const suggestions = getTierUpgradeSuggestions({ tierCode, verified, premium, elite });

  await prisma.bnhubLuxuryTier.upsert({
    where: { listingId },
    create: {
      listingId,
      tierCode,
      tierScore,
      eligibilityStatus: eligibility,
      trustComponentScore: trustScore,
      qualityComponentScore: classification?.overallScore ?? 0,
      responsivenessComponentScore: responsiveness,
      hospitalityComponentScore: classification?.servicesScore ?? 0,
      visualComponentScore: visualScore,
      notes: suggestions[0] ?? null,
      breakdownJson: { ...breakdown, suggestions },
    },
    update: {
      tierCode,
      tierScore,
      eligibilityStatus: eligibility,
      trustComponentScore: trustScore,
      qualityComponentScore: classification?.overallScore ?? 0,
      responsivenessComponentScore: responsiveness,
      hospitalityComponentScore: classification?.servicesScore ?? 0,
      visualComponentScore: visualScore,
      notes: suggestions[0] ?? null,
      breakdownJson: { ...breakdown, suggestions },
      computedAt: new Date(),
    },
  });

  await suspendTierIfTrustDrops(listingId);
  await logTierDecision(listingId, { tierCode, eligibility, tierScore });
}

export async function upsertLuxuryTier(listingId: string): Promise<void> {
  await computeLuxuryTier(listingId);
}

export async function refreshLuxuryTierForListing(listingId: string): Promise<void> {
  await computeLuxuryTier(listingId);
}
