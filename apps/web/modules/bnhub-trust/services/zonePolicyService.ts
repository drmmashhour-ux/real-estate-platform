import {
  BnhubTrustAccessSafetyResult,
  BnhubTrustIdentityAuditActor,
  BnhubTrustLocationPolicyStatus,
  BnhubTrustRestrictedZoneAction,
  BnhubTrustZonePolicyResult,
  BnhubTrustRiskFlagTypeV2,
  BnhubFraudSeverity,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logPolicyAction } from "@/modules/bnhub-trust/services/trustDecisionAuditService";
import { createRiskFlag } from "@/modules/bnhub-trust/services/riskFlagService";

/**
 * Admin-configured zones only — no automated "dangerous neighborhood" inference.
 */
export async function checkRestrictedZonePolicy(listingId: string): Promise<{
  zonePolicyResult: BnhubTrustZonePolicyResult;
  accessSafetyResult: BnhubTrustAccessSafetyResult;
  matchedZoneId?: string;
}> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { city: true, region: true, country: true, address: true },
  });
  if (!listing) {
    return { zonePolicyResult: BnhubTrustZonePolicyResult.UNKNOWN, accessSafetyResult: BnhubTrustAccessSafetyResult.REVIEW_REQUIRED };
  }

  const zones = await prisma.bnhubRestrictedZone.findMany({
    where: { isActive: true },
  });

  let zonePolicyResult: BnhubTrustZonePolicyResult = BnhubTrustZonePolicyResult.CLEAR;
  let accessSafetyResult: BnhubTrustAccessSafetyResult = BnhubTrustAccessSafetyResult.CLEAR;
  let matchedZoneId: string | undefined;

  const regionNorm = (listing.region ?? "").toUpperCase().trim();

  for (const z of zones) {
    let hit = false;
    if (z.regionCode && regionNorm && z.regionCode.toUpperCase() === regionNorm) hit = true;
    if (z.postalCode && listing.address.toUpperCase().includes(z.postalCode.toUpperCase())) hit = true;
    if (hit) {
      matchedZoneId = z.id;
      if (z.policyAction === BnhubTrustRestrictedZoneAction.RESTRICTED) {
        zonePolicyResult = BnhubTrustZonePolicyResult.RESTRICTED_ZONE;
        accessSafetyResult = BnhubTrustAccessSafetyResult.RESTRICTED;
      } else if (z.policyAction === BnhubTrustRestrictedZoneAction.REJECTED) {
        zonePolicyResult = BnhubTrustZonePolicyResult.RESTRICTED_ZONE;
        accessSafetyResult = BnhubTrustAccessSafetyResult.RESTRICTED;
      } else {
        zonePolicyResult = BnhubTrustZonePolicyResult.REVIEW_REQUIRED;
        accessSafetyResult = BnhubTrustAccessSafetyResult.REVIEW_REQUIRED;
      }
      break;
    }
  }

  return { zonePolicyResult, accessSafetyResult, matchedZoneId };
}

export async function upsertLocationPolicyProfile(listingId: string) {
  const check = await checkRestrictedZonePolicy(listingId);
  let policyStatus: BnhubTrustLocationPolicyStatus = BnhubTrustLocationPolicyStatus.PENDING;
  if (check.zonePolicyResult === BnhubTrustZonePolicyResult.RESTRICTED_ZONE) {
    policyStatus =
      check.accessSafetyResult === BnhubTrustAccessSafetyResult.RESTRICTED
        ? BnhubTrustLocationPolicyStatus.RESTRICTED
        : BnhubTrustLocationPolicyStatus.MANUAL_REVIEW_REQUIRED;
  } else if (check.zonePolicyResult === BnhubTrustZonePolicyResult.REVIEW_REQUIRED) {
    policyStatus = BnhubTrustLocationPolicyStatus.MANUAL_REVIEW_REQUIRED;
  } else if (check.zonePolicyResult === BnhubTrustZonePolicyResult.CLEAR) {
    policyStatus = BnhubTrustLocationPolicyStatus.APPROVED;
  }

  await prisma.bnhubLocationPolicyProfile.upsert({
    where: { listingId },
    create: {
      listingId,
      policyStatus,
      zonePolicyResult: check.zonePolicyResult,
      accessSafetyResult: check.accessSafetyResult,
      evidenceJson: { matchedZoneId: check.matchedZoneId ?? null, source: "admin_zone_table" },
    },
    update: {
      policyStatus,
      zonePolicyResult: check.zonePolicyResult,
      accessSafetyResult: check.accessSafetyResult,
      evidenceJson: { matchedZoneId: check.matchedZoneId ?? null, source: "admin_zone_table" },
    },
  });
  await logPolicyAction({
    actorType: BnhubTrustIdentityAuditActor.SYSTEM,
    listingId,
    actionType: "zone_policy_upsert",
    actionSummary: `Zone ${check.zonePolicyResult}, access ${check.accessSafetyResult}`,
  });
}

export async function createRestrictedZoneFlagIfNeeded(listingId: string) {
  const check = await checkRestrictedZonePolicy(listingId);
  if (check.zonePolicyResult !== BnhubTrustZonePolicyResult.RESTRICTED_ZONE) return;
  await createRiskFlag({
    listingId,
    flagType: BnhubTrustRiskFlagTypeV2.RESTRICTED_ZONE,
    severity: BnhubFraudSeverity.HIGH,
    summary: "Listing location matches an admin-configured policy zone — internal review required.",
    evidence: { matchedZoneId: check.matchedZoneId },
    dedupeListing: true,
  });
}

export async function checkListingLocationPolicy(listingId: string) {
  await upsertLocationPolicyProfile(listingId);
  await createRestrictedZoneFlagIfNeeded(listingId);
  return prisma.bnhubLocationPolicyProfile.findUnique({ where: { listingId } });
}
