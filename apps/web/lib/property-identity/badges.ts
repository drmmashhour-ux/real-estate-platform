/**
 * Property trust badges based on verification and risk.
 */

import { prisma } from "@/lib/db";
import type { VerificationLevel } from "./verification-score";
import { computeVerificationScore } from "./verification-score";

export type PropertyBadge =
  | "verified_property"
  | "verified_owner"
  | "verified_broker_listing"
  | "under_review"
  | "high_risk_listing";

export interface PropertyBadgesResult {
  badges: PropertyBadge[];
  verificationScore: number;
  verificationLevel: VerificationLevel;
  riskLevel: string | null;
}

export async function getPropertyBadges(propertyIdentityId: string): Promise<PropertyBadgesResult> {
  const [identity, risk, { score, level }] = await Promise.all([
    prisma.propertyIdentity.findUnique({
      where: { id: propertyIdentityId },
      select: { verificationScore: true },
    }),
    prisma.propertyIdentityRisk.findFirst({
      where: { propertyIdentityId },
      orderBy: { lastEvaluatedAt: "desc" },
      select: { riskLevel: true },
    }),
    computeVerificationScore(propertyIdentityId),
  ]);

  const badges: PropertyBadge[] = [];
  const verifications = await prisma.propertyIdentityVerification.findMany({
    where: { propertyIdentityId, verificationStatus: "verified" },
    select: { verificationType: true },
  });
  const types = new Set(verifications.map((v) => v.verificationType));

  if (level === "strong" || (identity?.verificationScore ?? score) >= 80) {
    badges.push("verified_property");
  }
  if (types.has("identity_match")) badges.push("verified_owner");
  if (types.has("broker_authorization_check") && types.has("broker_license_check")) {
    badges.push("verified_broker_listing");
  }

  if (risk?.riskLevel === "high") {
    badges.push("high_risk_listing");
  } else if (
    risk?.riskLevel === "medium" ||
    (await prisma.propertyIdentityLink.count({ where: { propertyIdentityId, linkStatus: "pending" } })) > 0
  ) {
    badges.push("under_review");
  }

  return {
    badges,
    verificationScore: identity?.verificationScore ?? score,
    verificationLevel: level,
    riskLevel: risk?.riskLevel ?? null,
  };
}
