import { NextResponse } from "next/server";
import { complianceFlags } from "@/config/feature-flags";
import { evaluateBrokerLicenceForBrokerage } from "@/lib/compliance/oaciq/broker-licence-service";
import { prisma } from "@/lib/db";

export function centrisListingEligibilityEnforced(): boolean {
  return complianceFlags.centrisListingEligibilityV1;
}

export type BrokerCentrisListingEligibility = {
  isLicensedBroker: boolean;
  hasCentrisAccess: boolean;
  centrisMemberId: string | null;
  /** When enforcement flag is on: licence + Centris access. When off: same as isLicensedBroker for internal publish. */
  canPublishToInternalMarketplace: boolean;
};

export async function getBrokerCentrisListingEligibility(brokerUserId: string): Promise<BrokerCentrisListingEligibility> {
  const [licence, profile] = await Promise.all([
    evaluateBrokerLicenceForBrokerage({
      brokerUserId,
      scope: { transactionType: "listing" },
      persistCheck: false,
    }),
    prisma.lecipmBrokerLicenceProfile.findUnique({
      where: { userId: brokerUserId },
      select: { hasCentrisAccess: true, centrisMemberId: true },
    }),
  ]);

  const isLicensedBroker = licence.allowed;
  const hasCentrisAccess = profile?.hasCentrisAccess ?? false;
  const centrisMemberId = profile?.centrisMemberId?.trim() || null;

  const canPublishToInternalMarketplace = centrisListingEligibilityEnforced()
    ? isLicensedBroker && hasCentrisAccess
    : isLicensedBroker;

  return {
    isLicensedBroker,
    hasCentrisAccess,
    centrisMemberId,
    canPublishToInternalMarketplace,
  };
}

/**
 * When {@link centrisListingEligibilityEnforced} is on, internal marketplace publish requires OACIQ licence path + Centris subscription flag.
 */
export async function requireCentrisListingPublishEligibility(
  brokerUserId: string,
  context: string,
): Promise<NextResponse | null> {
  if (!centrisListingEligibilityEnforced()) return null;

  const e = await getBrokerCentrisListingEligibility(brokerUserId);
  if (e.canPublishToInternalMarketplace) return null;

  return NextResponse.json(
    {
      error:
        "Listing publication requires an active residential broker licence and Centris access on file. Complete licensing and Centris subscription verification, or keep the listing as draft.",
      code: "CENTRIS_LISTING_ELIGIBILITY_BLOCK",
      context,
      eligibility: {
        isLicensedBroker: e.isLicensedBroker,
        hasCentrisAccess: e.hasCentrisAccess,
      },
    },
    { status: 403 },
  );
}

export function centrisEligibilityUiLabel(e: BrokerCentrisListingEligibility): "eligible" | "not_connected" {
  if (e.isLicensedBroker && e.hasCentrisAccess) return "eligible";
  return "not_connected";
}
