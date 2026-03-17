/**
 * Run full fraud check for a listing: gather context, run all rules, score, store results, optionally freeze.
 */

import { prisma } from "@/lib/db";
import { getRiskLevel, FRAUD_SCORE_THRESHOLD_FREEZE } from "../models";
import { computeFraudScore } from "./scoring-service";
import { checkDuplicateCadastre, checkCadastreMultipleUsers, checkCadastreDifferentCities } from "../rules/cadastre-signals";
import { checkOwnerNameMismatch, checkMultipleListingsNewAccount, checkUnverifiedIdentity } from "../rules/identity-signals";
import { checkInvalidBrokerLicense, checkBrokerNoAuthorizationDocument, checkBrokerSuspiciousListings } from "../rules/broker-signals";
import { checkLowDocumentConfidence, checkMissingOwnershipDocument } from "../rules/document-signals";
import { checkRapidListingCreation, checkUnusualPricing, checkDuplicateAddress, checkDuplicateCoordinates } from "../rules/behavior-signals";
import type { FraudReason } from "../models";

export type CheckListingResult = {
  listingId: string;
  fraudScore: number;
  riskLevel: string;
  reasons: FraudReason[];
  frozen: boolean;
}

export async function runFraudCheckForListing(listingId: string): Promise<CheckListingResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      owner: true,
      propertyDocuments: { where: { documentType: "LAND_REGISTRY_EXTRACT" }, include: { documentExtractions: true } },
    },
  });
  if (!listing) throw new Error("Listing not found");

  const reasons: FraudReason[] = [];

  const docOwnerName = listing.propertyDocuments?.[0]?.documentExtractions?.[0]?.ownerName ?? listing.propertyDocuments?.[0]?.ownerName ?? null;

  const [
    dupCadastre,
    cadastreMultiUser,
    cadastreDiffCity,
    ownerMismatch,
    multiNewAccount,
    unverifiedId,
    invalidLicense,
    brokerNoAuth,
    brokerSuspicious,
    lowConfidence,
    missingDoc,
    rapidCreation,
    unusualPrice,
    dupAddress,
    dupCoords,
  ] = await Promise.all([
    checkDuplicateCadastre(listingId, listing.cadastreNumber, listing.ownerId),
    checkCadastreMultipleUsers(listingId, listing.cadastreNumber),
    checkCadastreDifferentCities(listingId, listing.cadastreNumber, listing.city),
    checkOwnerNameMismatch(listingId, docOwnerName, listing.ownerId),
    checkMultipleListingsNewAccount(listing.ownerId),
    checkUnverifiedIdentity(listing.ownerId),
    checkInvalidBrokerLicense(listing.brokerLicenseNumber),
    checkBrokerNoAuthorizationDocument(listingId, listing.listingAuthorityType),
    listing.listingAuthorityType === "BROKER" ? checkBrokerSuspiciousListings(listing.ownerId) : Promise.resolve(null),
    checkLowDocumentConfidence(listingId),
    checkMissingOwnershipDocument(listingId, listing.listingVerificationStatus),
    checkRapidListingCreation(listing.ownerId),
    checkUnusualPricing(listingId, listing.nightPriceCents, listing.city),
    checkDuplicateAddress(listingId, listing.address),
    checkDuplicateCoordinates(listingId, listing.latitude, listing.longitude),
  ]);

  for (const r of [dupCadastre, cadastreMultiUser, cadastreDiffCity, ownerMismatch, multiNewAccount, unverifiedId, invalidLicense, brokerNoAuth, brokerSuspicious, lowConfidence, missingDoc, rapidCreation, unusualPrice, dupAddress, dupCoords]) {
    if (r) reasons.push(r);
  }

  const { fraudScore, riskLevel, alerts } = computeFraudScore(reasons);

  await prisma.propertyFraudScore.upsert({
    where: { listingId },
    create: {
      listingId,
      fraudScore,
      riskLevel,
      reasons: reasons as object,
    },
    update: {
      fraudScore,
      riskLevel,
      reasons: reasons as object,
    },
  });

  for (const a of alerts) {
    await prisma.propertyFraudAlert.create({
      data: {
        listingId,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message,
        status: "open",
      },
    });
  }

  let frozen = false;
  if (fraudScore > FRAUD_SCORE_THRESHOLD_FREEZE) {
    await prisma.shortTermListing.update({
      where: { id: listingId },
      data: { listingStatus: "UNDER_INVESTIGATION" },
    });
    frozen = true;
    if (listing.propertyIdentityId) {
      const { upsertPropertyIdentityRisk } = await import("@/lib/property-identity/risk");
      const riskLevel = fraudScore >= 80 ? "high" : fraudScore >= 50 ? "medium" : "low";
      await upsertPropertyIdentityRisk(
        listing.propertyIdentityId,
        { riskScore: fraudScore, riskLevel: riskLevel as "low" | "medium" | "high", riskReasons: reasons },
        null
      );
      const { recordEvent } = await import("@/lib/property-identity/events");
      await recordEvent(listing.propertyIdentityId, "fraud_flag_added", { listingId, fraudScore, riskLevel }, null);
    }
  }

  return {
    listingId,
    fraudScore,
    riskLevel,
    reasons,
    frozen,
  };
}
