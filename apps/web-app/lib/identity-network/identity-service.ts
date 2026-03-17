/**
 * Global Real Estate Identity Network – core service.
 * CRUD for owner/broker/organization identities, listing authorities, history, links, risk, events.
 */

import { prisma } from "@/lib/db";
import { normalizeLegalName, normalizeOrganizationName } from "./normalize";
import {
  resolveOwnerIdentity,
  resolveBrokerIdentity,
  resolveOrganizationIdentity,
  type OwnerResolutionInput,
  type BrokerResolutionInput,
  type OrganizationResolutionInput,
} from "./resolution";
import type {
  OwnerIdentityInput,
  BrokerIdentityInput,
  OrganizationIdentityInput,
  ListingAuthorityInput,
  IdentityRiskInput,
  IdentityNetworkPropertyView,
} from "./types";
import type { IdentityType } from "./types";

// ---------- Owner Identity ----------
function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export async function createOwnerIdentity(input: OwnerIdentityInput) {
  const normalizedName = normalizeLegalName(input.legalName);
  return prisma.ownerIdentity.create({
    data: {
      legalName: collapseSpaces(input.legalName),
      normalizedName,
      primarySource: input.primarySource ?? null,
      verificationStatus: input.verificationStatus ?? "PENDING",
    },
  });
}

export async function getOwnerIdentity(id: string) {
  return prisma.ownerIdentity.findUnique({
    where: { id },
    include: {
      ownershipHistory: { orderBy: { effectiveStartDate: "desc" }, take: 50 },
      listingAuthorities: { take: 20 },
    },
  });
}

export async function resolveOwner(input: OwnerResolutionInput & { existingOwnerIdentityId?: string | null }) {
  let existingNormalizedName: string | null = null;
  if (input.existingOwnerIdentityId) {
    const existing = await prisma.ownerIdentity.findUnique({
      where: { id: input.existingOwnerIdentityId },
      select: { normalizedName: true },
    });
    existingNormalizedName = existing?.normalizedName ?? null;
  }
  return resolveOwnerIdentity({
    legalName: input.legalName,
    documentOwnerName: input.documentOwnerName,
    existingNormalizedName,
  });
}

// ---------- Broker Identity ----------
export async function createBrokerIdentity(input: BrokerIdentityInput) {
  const normalizedName = normalizeLegalName(input.legalName);
  return prisma.brokerIdentity.create({
    data: {
      legalName: input.legalName.trim(),
      normalizedName,
      licenseNumber: input.licenseNumber.trim(),
      brokerageName: input.brokerageName.trim(),
      regulatorRef: input.regulatorRef?.trim() ?? null,
      verificationStatus: input.verificationStatus ?? "PENDING",
    },
  });
}

export async function getBrokerIdentity(id: string) {
  return prisma.brokerIdentity.findUnique({
    where: { id },
    include: {
      brokerAuthorizationHistory: { orderBy: { startDate: "desc" }, take: 50 },
      listingAuthorities: { take: 20 },
    },
  });
}

export async function resolveBroker(
  input: BrokerResolutionInput & { existingBrokerIdentityId?: string | null }
) {
  let existingNormalizedName: string | null = null;
  let existingLicenseNumber: string | null = null;
  let existingBrokerageName: string | null = null;
  if (input.existingBrokerIdentityId) {
    const existing = await prisma.brokerIdentity.findUnique({
      where: { id: input.existingBrokerIdentityId },
      select: { normalizedName: true, licenseNumber: true, brokerageName: true },
    });
    if (existing) {
      existingNormalizedName = existing.normalizedName;
      existingLicenseNumber = existing.licenseNumber;
      existingBrokerageName = existing.brokerageName;
    }
  }
  return resolveBrokerIdentity({
    legalName: input.legalName,
    licenseNumber: input.licenseNumber,
    brokerageName: input.brokerageName,
    existingNormalizedName: existingNormalizedName ?? input.existingNormalizedName ?? null,
    existingLicenseNumber: existingLicenseNumber ?? input.existingLicenseNumber ?? null,
    existingBrokerageName: existingBrokerageName ?? input.existingBrokerageName ?? null,
  });
}

// ---------- Organization Identity ----------
export async function createOrganizationIdentity(input: OrganizationIdentityInput) {
  const normalizedName = normalizeOrganizationName(input.legalName);
  return prisma.organizationIdentity.create({
    data: {
      legalName: collapseSpaces(input.legalName),
      normalizedName,
      organizationType: input.organizationType.trim(),
      verificationStatus: input.verificationStatus ?? "PENDING",
    },
  });
}

export async function getOrganizationIdentity(id: string) {
  return prisma.organizationIdentity.findUnique({
    where: { id },
    include: { listingAuthorities: { take: 20 } },
  });
}

export async function resolveOrganization(
  input: OrganizationResolutionInput & { existingOrganizationIdentityId?: string | null }
) {
  let existingNormalizedName: string | null = null;
  if (input.existingOrganizationIdentityId) {
    const existing = await prisma.organizationIdentity.findUnique({
      where: { id: input.existingOrganizationIdentityId },
      select: { normalizedName: true },
    });
    existingNormalizedName = existing?.normalizedName ?? null;
  }
  return resolveOrganizationIdentity({
    legalName: input.legalName,
    existingNormalizedName: existingNormalizedName ?? input.existingNormalizedName ?? null,
  });
}

// ---------- Listing Authority ----------
export async function createListingAuthority(input: ListingAuthorityInput) {
  return prisma.listingAuthority.create({
    data: {
      propertyIdentityId: input.propertyIdentityId,
      authorityType: input.authorityType,
      ownerIdentityId: input.ownerIdentityId ?? undefined,
      brokerIdentityId: input.brokerIdentityId ?? undefined,
      organizationIdentityId: input.organizationIdentityId ?? undefined,
      documentReference: input.documentReference ?? undefined,
      startDate: input.startDate,
      endDate: input.endDate ?? undefined,
      status: input.status ?? "ACTIVE",
      verificationStatus: input.verificationStatus ?? "PENDING",
    },
  });
}

// ---------- Property: link owner, link broker, create authority ----------
export async function linkPropertyOwner(propertyIdentityId: string, ownerIdentityId: string, source: string) {
  const owner = await prisma.ownerIdentity.findUnique({ where: { id: ownerIdentityId } });
  if (!owner) throw new Error("Owner identity not found");
  const prop = await prisma.propertyIdentity.findUnique({ where: { id: propertyIdentityId } });
  if (!prop) throw new Error("Property identity not found");
  return prisma.ownershipHistory.create({
    data: {
      propertyIdentityId,
      ownerIdentityId,
      source,
      effectiveStartDate: new Date(),
      verificationStatus: "PENDING",
    },
  });
}

export async function linkPropertyBroker(
  propertyIdentityId: string,
  brokerIdentityId: string,
  params: { authorizationSource: string; ownerIdentityId?: string | null; verificationStatus?: string }
) {
  const broker = await prisma.brokerIdentity.findUnique({ where: { id: brokerIdentityId } });
  if (!broker) throw new Error("Broker identity not found");
  const prop = await prisma.propertyIdentity.findUnique({ where: { id: propertyIdentityId } });
  if (!prop) throw new Error("Property identity not found");
  return prisma.brokerAuthorizationHistory.create({
    data: {
      propertyIdentityId,
      brokerIdentityId,
      ownerIdentityId: params.ownerIdentityId ?? undefined,
      authorizationSource: params.authorizationSource,
      startDate: new Date(),
      verificationStatus: params.verificationStatus ?? "PENDING",
    },
  });
}

// ---------- Identity Links (user <-> owner/broker) ----------
export async function linkUserToIdentity(
  identityType: "OWNER" | "BROKER",
  identityId: string,
  userId: string
) {
  return prisma.identityLink.upsert({
    where: {
      identityType_identityId_userId: { identityType, identityId, userId },
    },
    create: { identityType, identityId, userId, linkStatus: "ACTIVE" },
    update: { linkStatus: "ACTIVE" },
  });
}

export async function getIdentityLinks(identityType: IdentityType, identityId: string) {
  return prisma.identityLink.findMany({
    where: { identityType, identityId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

// ---------- Ownership & Authorization history (by property) ----------
export async function getPropertyOwnershipHistory(propertyIdentityId: string) {
  return prisma.ownershipHistory.findMany({
    where: { propertyIdentityId },
    orderBy: { effectiveStartDate: "desc" },
    include: { ownerIdentity: true },
  });
}

export async function getPropertyAuthorizationHistory(propertyIdentityId: string) {
  return prisma.brokerAuthorizationHistory.findMany({
    where: { propertyIdentityId },
    orderBy: { startDate: "desc" },
    include: { brokerIdentity: true, ownerIdentity: true },
  });
}

// ---------- Property identity network view ----------
export async function getPropertyIdentityNetworkView(
  propertyIdentityId: string
): Promise<IdentityNetworkPropertyView | null> {
  const prop = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    include: {
      ownershipHistory: { orderBy: { effectiveStartDate: "desc" }, include: { ownerIdentity: true } },
      brokerAuthorizationHistory: {
        orderBy: { startDate: "desc" },
        include: { brokerIdentity: true },
      },
      listingAuthorities: {
        include: { ownerIdentity: true, brokerIdentity: true },
      },
    },
  });
  if (!prop) return null;
  return {
    propertyIdentityId: prop.id,
    ownershipHistory: prop.ownershipHistory.map((h) => ({
      ownerIdentityId: h.ownerIdentityId,
      legalName: h.ownerIdentity.legalName,
      normalizedName: h.ownerIdentity.normalizedName,
      source: h.source,
      effectiveStartDate: h.effectiveStartDate.toISOString(),
      effectiveEndDate: h.effectiveEndDate?.toISOString() ?? null,
      verificationStatus: h.verificationStatus,
    })),
    brokerAuthorizationHistory: prop.brokerAuthorizationHistory.map((h) => ({
      brokerIdentityId: h.brokerIdentityId,
      legalName: h.brokerIdentity.legalName,
      licenseNumber: h.brokerIdentity.licenseNumber,
      authorizationSource: h.authorizationSource,
      startDate: h.startDate.toISOString(),
      endDate: h.endDate?.toISOString() ?? null,
      verificationStatus: h.verificationStatus,
    })),
    listingAuthorities: prop.listingAuthorities.map((la) => ({
      id: la.id,
      authorityType: la.authorityType,
      ownerIdentityId: la.ownerIdentityId,
      brokerIdentityId: la.brokerIdentityId,
      status: la.status,
      verificationStatus: la.verificationStatus,
      startDate: la.startDate.toISOString(),
      endDate: la.endDate?.toISOString() ?? null,
    })),
  };
}

// ---------- Risk ----------
export async function upsertIdentityRiskProfile(input: IdentityRiskInput) {
  return prisma.identityRiskProfile.upsert({
    where: {
      identityType_identityId: { identityType: input.identityType, identityId: input.identityId },
    },
    create: {
      identityType: input.identityType,
      identityId: input.identityId,
      riskScore: input.riskScore,
      riskLevel: input.riskLevel,
      riskReasons: input.riskReasons ?? undefined,
      investigationStatus: input.investigationStatus ?? undefined,
    },
    update: {
      riskScore: input.riskScore,
      riskLevel: input.riskLevel,
      riskReasons: input.riskReasons ?? undefined,
      investigationStatus: input.investigationStatus ?? undefined,
    },
  });
}

export async function getIdentityRiskProfile(identityType: IdentityType, identityId: string) {
  return prisma.identityRiskProfile.findUnique({
    where: { identityType_identityId: { identityType, identityId } },
  });
}

// ---------- Events ----------
export async function recordIdentityEvent(params: {
  identityType: string;
  identityId: string;
  eventType: string;
  eventData?: Record<string, unknown> | null;
  createdBy?: string | null;
}) {
  return prisma.identityEvent.create({
    data: {
      identityType: params.identityType,
      identityId: params.identityId,
      eventType: params.eventType,
      eventData: params.eventData ?? undefined,
      createdBy: params.createdBy ?? undefined,
    },
  });
}

// ---------- Property Identity (by id) for API ----------
export async function getPropertyIdentityById(id: string) {
  return prisma.propertyIdentity.findUnique({
    where: { id },
    select: {
      id: true,
      propertyUid: true,
      cadastreNumber: true,
      normalizedAddress: true,
      municipality: true,
      province: true,
      country: true,
      latitude: true,
      longitude: true,
      propertyType: true,
      verificationScore: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ---------- Admin: search ----------
export type IdentitySearchType = "property" | "owner" | "broker" | "organization";

export async function adminSearchIdentityNetwork(params: {
  q: string;
  type: IdentitySearchType;
  limit?: number;
}) {
  const limit = Math.min(params.limit ?? 20, 100);
  const q = params.q.trim();
  if (!q) return { results: [] };

  if (params.type === "property") {
    const results = await prisma.propertyIdentity.findMany({
      where: {
        OR: [
          { cadastreNumber: { contains: q, mode: "insensitive" } },
          { normalizedAddress: { contains: q, mode: "insensitive" } },
          { propertyUid: { contains: q, mode: "insensitive" } },
          { municipality: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        propertyUid: true,
        cadastreNumber: true,
        normalizedAddress: true,
        municipality: true,
        province: true,
      },
    });
    return { results };
  }

  if (params.type === "owner") {
    const results = await prisma.ownerIdentity.findMany({
      where: {
        OR: [
          { legalName: { contains: q, mode: "insensitive" } },
          { normalizedName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
    });
    return { results };
  }

  if (params.type === "broker") {
    const results = await prisma.brokerIdentity.findMany({
      where: {
        OR: [
          { legalName: { contains: q, mode: "insensitive" } },
          { normalizedName: { contains: q, mode: "insensitive" } },
          { licenseNumber: { contains: q, mode: "insensitive" } },
          { brokerageName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
    });
    return { results };
  }

  if (params.type === "organization") {
    const results = await prisma.organizationIdentity.findMany({
      where: {
        OR: [
          { legalName: { contains: q, mode: "insensitive" } },
          { normalizedName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
    });
    return { results };
  }

  return { results: [] };
}

// ---------- Admin: merge identities ----------
export async function adminMergeOwnerIdentities(
  primaryOwnerIdentityId: string,
  duplicateOwnerIdentityId: string,
  adminUserId: string
) {
  const [primary, duplicate] = await Promise.all([
    prisma.ownerIdentity.findUnique({ where: { id: primaryOwnerIdentityId } }),
    prisma.ownerIdentity.findUnique({ where: { id: duplicateOwnerIdentityId } }),
  ]);
  if (!primary) throw new Error("Primary owner identity not found");
  if (!duplicate) throw new Error("Duplicate owner identity not found");
  if (primary.id === duplicate.id) throw new Error("Cannot merge same identity");

  await prisma.$transaction([
    prisma.ownershipHistory.updateMany({
      where: { ownerIdentityId: duplicate.id },
      data: { ownerIdentityId: primary.id },
    }),
    prisma.listingAuthority.updateMany({
      where: { ownerIdentityId: duplicate.id },
      data: { ownerIdentityId: primary.id },
    }),
    prisma.brokerAuthorizationHistory.updateMany({
      where: { ownerIdentityId: duplicate.id },
      data: { ownerIdentityId: primary.id },
    }),
    prisma.ownerIdentity.update({
      where: { id: duplicate.id },
      data: { status: "MERGED" },
    }),
    prisma.identityEvent.create({
      data: {
        identityType: "OWNER",
        identityId: primary.id,
        eventType: "identity_merged",
        eventData: { duplicateId: duplicate.id, mergedBy: adminUserId },
        createdBy: adminUserId,
      },
    }),
  ]);

  return prisma.ownerIdentity.findUnique({ where: { id: primary.id }, include: { ownershipHistory: true } });
}

export async function adminMergeBrokerIdentities(
  primaryBrokerIdentityId: string,
  duplicateBrokerIdentityId: string,
  adminUserId: string
) {
  const [primary, duplicate] = await Promise.all([
    prisma.brokerIdentity.findUnique({ where: { id: primaryBrokerIdentityId } }),
    prisma.brokerIdentity.findUnique({ where: { id: duplicateBrokerIdentityId } }),
  ]);
  if (!primary) throw new Error("Primary broker identity not found");
  if (!duplicate) throw new Error("Duplicate broker identity not found");
  if (primary.id === duplicate.id) throw new Error("Cannot merge same identity");

  await prisma.$transaction([
    prisma.brokerAuthorizationHistory.updateMany({
      where: { brokerIdentityId: duplicate.id },
      data: { brokerIdentityId: primary.id },
    }),
    prisma.listingAuthority.updateMany({
      where: { brokerIdentityId: duplicate.id },
      data: { brokerIdentityId: primary.id },
    }),
    prisma.identityLink.updateMany({
      where: { identityType: "BROKER", identityId: duplicate.id },
      data: { identityId: primary.id },
    }),
    prisma.brokerIdentity.update({
      where: { id: duplicate.id },
      data: { status: "MERGED" },
    }),
    prisma.identityEvent.create({
      data: {
        identityType: "BROKER",
        identityId: primary.id,
        eventType: "identity_merged",
        eventData: { duplicateId: duplicate.id, mergedBy: adminUserId },
        createdBy: adminUserId,
      },
    }),
  ]);

  return prisma.brokerIdentity.findUnique({ where: { id: primary.id }, include: { brokerAuthorizationHistory: true } });
}

// ---------- Admin: mark risk ----------
export async function adminMarkIdentityRisk(
  identityType: IdentityType,
  identityId: string,
  params: { riskScore: number; riskLevel: string; riskReasons?: unknown; investigationStatus?: string },
  adminUserId: string
) {
  const profile = await upsertIdentityRiskProfile({
    identityType,
    identityId,
    riskScore: params.riskScore,
    riskLevel: params.riskLevel as "low" | "medium" | "high" | "critical",
    riskReasons: params.riskReasons as Record<string, unknown> | undefined,
    investigationStatus: params.investigationStatus ?? undefined,
  });
  await recordIdentityEvent({
    identityType,
    identityId,
    eventType: "risk_marked",
    eventData: { riskScore: params.riskScore, riskLevel: params.riskLevel, by: adminUserId },
    createdBy: adminUserId,
  });
  return profile;
}

// ---------- Admin: resolve review (e.g. set verification status) ----------
export async function adminResolveOwnerReview(ownerIdentityId: string, verificationStatus: "VERIFIED" | "REJECTED", adminUserId: string) {
  const owner = await prisma.ownerIdentity.findUnique({ where: { id: ownerIdentityId } });
  if (!owner) throw new Error("Owner identity not found");
  await prisma.ownerIdentity.update({
    where: { id: ownerIdentityId },
    data: { verificationStatus },
  });
  await recordIdentityEvent({
    identityType: "OWNER",
    identityId: ownerIdentityId,
    eventType: "review_resolved",
    eventData: { verificationStatus, by: adminUserId },
    createdBy: adminUserId,
  });
  return prisma.ownerIdentity.findUnique({ where: { id: ownerIdentityId } });
}

export async function adminResolveBrokerReview(brokerIdentityId: string, verificationStatus: "VERIFIED" | "REJECTED", adminUserId: string) {
  const broker = await prisma.brokerIdentity.findUnique({ where: { id: brokerIdentityId } });
  if (!broker) throw new Error("Broker identity not found");
  await prisma.brokerIdentity.update({
    where: { id: brokerIdentityId },
    data: { verificationStatus },
  });
  await recordIdentityEvent({
    identityType: "BROKER",
    identityId: brokerIdentityId,
    eventType: "review_resolved",
    eventData: { verificationStatus, by: adminUserId },
    createdBy: adminUserId,
  });
  return prisma.brokerIdentity.findUnique({ where: { id: brokerIdentityId } });
}
