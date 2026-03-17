/**
 * Property identity verification score (0-100) from verification records.
 */

import { prisma } from "@/lib/db";
import { VERIFICATION_WEIGHTS, VERIFICATION_THRESHOLDS } from "./constants";

export type VerificationLevel = "insufficient" | "partial" | "strong";

export async function computeVerificationScore(propertyIdentityId: string): Promise<{ score: number; level: VerificationLevel }> {
  const verifications = await prisma.propertyIdentityVerification.findMany({
    where: { propertyIdentityId, verificationStatus: "verified" },
    select: { verificationType: true },
  });

  let score = 0;
  const types = new Set(verifications.map((v) => v.verificationType));

  if (types.has("cadastre_check")) score += VERIFICATION_WEIGHTS.cadastre_verified;
  if (types.has("land_registry_document")) score += VERIFICATION_WEIGHTS.land_registry_document_verified;
  if (types.has("identity_match")) score += VERIFICATION_WEIGHTS.owner_identity_match;
  if (types.has("geo_validation")) score += VERIFICATION_WEIGHTS.geo_validation;
  if (types.has("broker_license_check")) score += VERIFICATION_WEIGHTS.broker_license_valid;
  if (types.has("broker_authorization_check")) score += VERIFICATION_WEIGHTS.broker_authorization_valid;

  score = Math.min(100, score);

  let level: VerificationLevel = "insufficient";
  if (score >= VERIFICATION_THRESHOLDS.strong.min) level = "strong";
  else if (score >= VERIFICATION_THRESHOLDS.partial.min) level = "partial";

  return { score, level };
}

export async function updatePropertyIdentityVerificationScore(propertyIdentityId: string): Promise<number> {
  const { score } = await computeVerificationScore(propertyIdentityId);
  await prisma.propertyIdentity.update({
    where: { id: propertyIdentityId },
    data: { verificationScore: score },
  });
  return score;
}
