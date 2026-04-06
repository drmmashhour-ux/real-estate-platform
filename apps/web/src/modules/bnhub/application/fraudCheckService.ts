import { ListingStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  MIN_LISTING_PHOTOS_FOR_VERIFICATION,
  moderationPhotoCount,
} from "@/lib/bnhub/moderation-requirements";

export type FraudCheckFlag = {
  checkType: string;
  result: "pass" | "warning" | "fail";
  score: number;
  detail?: string;
};

/**
 * Roll up per-check scores into 0–100 fraud score (higher = riskier).
 */
export function aggregateFraudScore(flags: FraudCheckFlag[]): number {
  let agg = 0;
  for (const f of flags) {
    if (f.result === "fail") agg += f.score;
    else if (f.result === "warning") agg += Math.round(f.score * 0.45);
  }
  return Math.min(100, agg);
}

function riskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Runs rule-based fraud checks, persists rows in `fraud_checks`, updates `property_fraud_scores`.
 */
export async function runFraudChecks(listingId: string): Promise<{ fraudScore: number; flags: FraudCheckFlag[] }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: { propertyVerification: true, listingPhotos: true },
  });
  if (!listing) throw new Error("Listing not found");

  const flags: FraudCheckFlag[] = [];

  // Address / cadastre alignment
  const pv = listing.propertyVerification;
  const cadastreMismatch =
    Boolean(pv && listing.cadastreNumber && pv.cadastreNumber && listing.cadastreNumber.trim() !== pv.cadastreNumber.trim());
  if (cadastreMismatch) {
    flags.push({ checkType: "address", result: "fail", score: 40, detail: "Cadastre mismatch vs verification record" });
  } else if (pv?.verificationStatus === VerificationStatus.VERIFIED) {
    flags.push({ checkType: "address", result: "pass", score: 0, detail: "Property verification approved" });
  } else if (pv) {
    flags.push({
      checkType: "address",
      result: "warning",
      score: 35,
      detail: "Property verification not completed",
    });
  } else if (listing.cadastreNumber) {
    flags.push({ checkType: "address", result: "warning", score: 25, detail: "No property verification row" });
  } else {
    flags.push({ checkType: "address", result: "warning", score: 20, detail: "No cadastre / verification on file" });
  }

  // Images (same count semantics as admin verification checklist)
  const photoCount = moderationPhotoCount({
    photos: listing.photos,
    listingPhotos: Array.isArray(listing.listingPhotos)
      ? (listing.listingPhotos as { id: string }[])
      : [],
  });
  if (photoCount < 1) {
    flags.push({ checkType: "image", result: "fail", score: 30, detail: "No listing photos" });
  } else if (photoCount < MIN_LISTING_PHOTOS_FOR_VERIFICATION) {
    flags.push({
      checkType: "image",
      result: "warning",
      score: 15,
      detail: `Fewer than ${MIN_LISTING_PHOTOS_FOR_VERIFICATION} photos`,
    });
  } else {
    flags.push({ checkType: "image", result: "pass", score: 0 });
  }

  // Price vs peers (same city)
  const peers = await prisma.shortTermListing.aggregate({
    where: {
      city: listing.city,
      id: { not: listing.id },
      listingStatus: { in: [ListingStatus.PUBLISHED, ListingStatus.APPROVED] },
    },
    _avg: { nightPriceCents: true },
    _count: { _all: true },
  });
  const avg = peers._avg.nightPriceCents;
  const cnt = peers._count._all;
  if (cnt >= 3 && avg && avg > 0) {
    const ratio = listing.nightPriceCents / avg;
    if (ratio < 0.35 || ratio > 2.8) {
      flags.push({
        checkType: "price",
        result: "warning",
        score: 30,
        detail: `Nightly price deviates from local average (ratio ${ratio.toFixed(2)})`,
      });
    } else {
      flags.push({ checkType: "price", result: "pass", score: 0 });
    }
  } else {
    flags.push({ checkType: "price", result: "pass", score: 0, detail: "Insufficient peer data" });
  }

  // Duplicate listing (same cadastre)
  if (listing.cadastreNumber?.trim()) {
    const dupes = await prisma.shortTermListing.count({
      where: {
        cadastreNumber: listing.cadastreNumber.trim(),
        id: { not: listing.id },
      },
    });
    if (dupes > 0) {
      flags.push({ checkType: "duplicate", result: "fail", score: 45, detail: `${dupes} other listing(s) share this cadastre` });
    } else {
      flags.push({ checkType: "duplicate", result: "pass", score: 0 });
    }
  } else {
    flags.push({ checkType: "duplicate", result: "warning", score: 10, detail: "Cannot check duplicates without cadastre" });
  }

  // Required fields
  const missing: string[] = [];
  if (!listing.title?.trim()) missing.push("title");
  if (!listing.description?.trim()) missing.push("description");
  if (!listing.address?.trim()) missing.push("address");
  if (!listing.beds || listing.beds < 1) missing.push("beds");
  if (missing.length) {
    flags.push({
      checkType: "required_fields",
      result: "fail",
      score: 25,
      detail: `Missing: ${missing.join(", ")}`,
    });
  } else {
    flags.push({ checkType: "required_fields", result: "pass", score: 0 });
  }

  const fraudScore = aggregateFraudScore(flags);
  const level = riskLevel(fraudScore);
  const reasons = flags.filter((f) => f.result !== "pass").map((f) => ({ check: f.checkType, result: f.result, detail: f.detail }));

  await prisma.$transaction(async (tx) => {
    for (const f of flags) {
      await tx.bnhubFraudCheck.create({
        data: {
          listingId,
          checkType: f.checkType,
          result: f.result,
          score: f.score,
          metadata: f.detail ? { detail: f.detail } : undefined,
        },
      });
    }

    await tx.propertyFraudScore.upsert({
      where: { listingId },
      create: {
        listingId,
        fraudScore,
        riskLevel: level,
        reasons: reasons as object,
      },
      update: {
        fraudScore,
        riskLevel: level,
        reasons: reasons as object,
      },
    });
  });

  return { fraudScore, flags };
}
