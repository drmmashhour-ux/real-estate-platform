import {
  FsboListingOwnerType,
  type LecipmLegalBoundaryComplianceState,
  type LecipmLegalBoundaryEntityType,
  type LecipmLegalBoundaryTransactionMode,
} from "@prisma/client";
import { evaluateBrokerLicenceForBrokerage } from "@/lib/compliance/oaciq/broker-licence-service";
import { prisma } from "@/lib/db";

export type ResolvedTransactionMode = {
  mode: LecipmLegalBoundaryTransactionMode;
  brokerId: string | null;
  complianceState: LecipmLegalBoundaryComplianceState;
};

async function firstLicensedBroker(userIds: string[]): Promise<{ brokerId: string; riskOk: boolean } | null> {
  const seen = new Set<string>();
  for (const raw of userIds) {
    const id = raw?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const ev = await evaluateBrokerLicenceForBrokerage({ brokerUserId: id, persistCheck: false });
    if (ev.allowed) {
      return { brokerId: id, riskOk: ev.riskLevel === "LOW" && ev.uiStatus === "verified" };
    }
  }
  return null;
}

async function resolveListingMode(listingId: string): Promise<ResolvedTransactionMode> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      lecipmOaciqComplianceHoldAt: true,
      brokerAccesses: { select: { brokerId: true, role: true } },
    },
  });

  if (listing) {
    if (listing.lecipmOaciqComplianceHoldAt) {
      return { mode: "FSBO", brokerId: null, complianceState: "BLOCKED" };
    }
    const roleOrder = (r: string) => (r === "owner" ? 0 : r === "collaborator" ? 1 : 2);
    const accessIds = [...listing.brokerAccesses]
      .sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
      .map((a) => a.brokerId);
    const candidates = [...accessIds, ...(listing.ownerId ? [listing.ownerId] : [])];
    const licensed = await firstLicensedBroker(candidates);
    if (licensed) {
      return {
        mode: "BROKERED",
        brokerId: licensed.brokerId,
        complianceState: licensed.riskOk ? "SAFE" : "RESTRICTED",
      };
    }
    return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
  }

  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      listingOwnerType: true,
    },
  });

  if (fsbo) {
    if (fsbo.listingOwnerType === FsboListingOwnerType.BROKER && fsbo.ownerId) {
      const licensed = await firstLicensedBroker([fsbo.ownerId]);
      if (licensed) {
        return {
          mode: "BROKERED",
          brokerId: licensed.brokerId,
          complianceState: licensed.riskOk ? "SAFE" : "RESTRICTED",
        };
      }
    }
    return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
  }

  return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
}

async function resolveDealMode(dealId: string): Promise<ResolvedTransactionMode> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      brokerId: true,
      listingId: true,
    },
  });
  if (!deal) {
    return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
  }
  if (deal.brokerId) {
    const licensed = await firstLicensedBroker([deal.brokerId]);
    if (licensed) {
      return {
        mode: "BROKERED",
        brokerId: licensed.brokerId,
        complianceState: licensed.riskOk ? "SAFE" : "RESTRICTED",
      };
    }
  }
  if (deal.listingId) {
    return resolveListingMode(deal.listingId);
  }
  return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
}

async function resolveBookingMode(visitId: string): Promise<ResolvedTransactionMode> {
  const visit = await prisma.lecipmVisit.findUnique({
    where: { id: visitId },
    select: { brokerUserId: true, listingId: true },
  });
  if (!visit) {
    return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
  }
  const licensed = await firstLicensedBroker([visit.brokerUserId]);
  if (licensed) {
    const listingMode = await resolveListingMode(visit.listingId);
    const complianceState =
      listingMode.complianceState === "BLOCKED"
        ? "BLOCKED"
        : !licensed.riskOk || listingMode.complianceState === "RESTRICTED"
          ? "RESTRICTED"
          : "SAFE";
    return {
      mode: "BROKERED",
      brokerId: licensed.brokerId,
      complianceState,
    };
  }
  return resolveListingMode(visit.listingId);
}

/**
 * Resolves OACIQ-safe transaction mode from the entity graph.
 * BROKERED when an active residential brokerage licence check passes for a linked broker user.
 */
export async function resolveTransactionMode(input: {
  entityType: LecipmLegalBoundaryEntityType;
  entityId: string;
}): Promise<ResolvedTransactionMode> {
  const id = input.entityId.trim();
  if (!id) {
    return { mode: "FSBO", brokerId: null, complianceState: "SAFE" };
  }
  switch (input.entityType) {
    case "LISTING":
      return resolveListingMode(id);
    case "DEAL":
      return resolveDealMode(id);
    case "BOOKING":
      return resolveBookingMode(id);
  }
}
