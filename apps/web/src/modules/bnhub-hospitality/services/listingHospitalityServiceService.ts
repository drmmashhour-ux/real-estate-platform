import type { BnhubListingServicePricingType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateServiceForListing } from "./serviceTrustSafetyService";
import { logHospitalityAction } from "./hospitalityAuditService";

export async function listListingServices(listingId: string) {
  return prisma.bnhubListingService.findMany({
    where: { listingId },
    include: { service: true },
  });
}

export async function validateListingServiceEligibility(listingId: string, serviceId: string) {
  return validateServiceForListing({ listingId, serviceId });
}

export async function enableServiceForListing(args: {
  listingId: string;
  hostUserId: string;
  serviceId: string;
  pricingType?: BnhubListingServicePricingType;
  priceCents?: number;
}) {
  const owned = await prisma.shortTermListing.findFirst({
    where: { id: args.listingId, ownerId: args.hostUserId },
    select: { id: true },
  });
  if (!owned) throw new Error("Forbidden");

  const gate = await validateServiceForListing({ listingId: args.listingId, serviceId: args.serviceId });
  if (!gate.allowed) throw new Error(gate.reason ?? "Service not allowed for this listing");

  const row = await prisma.bnhubListingService.upsert({
    where: { listingId_serviceId: { listingId: args.listingId, serviceId: args.serviceId } },
    create: {
      listingId: args.listingId,
      hostUserId: args.hostUserId,
      serviceId: args.serviceId,
      isEnabled: true,
      pricingType: args.pricingType ?? "FIXED",
      priceCents: args.priceCents ?? 0,
      moderationStatus: "APPROVED",
    },
    update: { isEnabled: true, hostUserId: args.hostUserId },
    include: { service: true },
  });
  await logHospitalityAction({
    actorType: "HOST",
    actorId: args.hostUserId,
    entityType: "BnhubListingService",
    entityId: row.id,
    actionType: "enable",
    actionSummary: `Enabled ${row.service.serviceCode} on listing ${args.listingId}`,
  });
  return row;
}

export async function disableServiceForListing(listingId: string, hostUserId: string, listingServiceId: string) {
  const existing = await prisma.bnhubListingService.findFirst({
    where: { id: listingServiceId, listingId, listing: { ownerId: hostUserId } },
    include: { service: true },
  });
  if (!existing) throw new Error("Not found");
  const row = await prisma.bnhubListingService.update({
    where: { id: listingServiceId },
    data: { isEnabled: false },
    include: { service: true },
  });
  await logHospitalityAction({
    actorType: "HOST",
    actorId: hostUserId,
    entityType: "BnhubListingService",
    entityId: row.id,
    actionType: "disable",
    actionSummary: `Disabled ${row.service.serviceCode}`,
  });
  return row;
}

export async function updateListingServicePricing(
  listingServiceId: string,
  hostUserId: string,
  patch: { pricingType?: BnhubListingServicePricingType; priceCents?: number; currency?: string }
) {
  const before = await prisma.bnhubListingService.findUniqueOrThrow({ where: { id: listingServiceId } });
  const row = await prisma.bnhubListingService.update({
    where: { id: listingServiceId },
    data: patch as Prisma.BnhubListingServiceUpdateInput,
  });
  await logHospitalityAction({
    actorType: "HOST",
    actorId: hostUserId,
    entityType: "BnhubListingService",
    entityId: listingServiceId,
    actionType: "pricing_update",
    actionSummary: "Updated listing service pricing",
    before: before as unknown as Prisma.InputJsonValue,
    after: row as unknown as Prisma.InputJsonValue,
  });
  return row;
}

export async function updateListingServiceRules(
  listingServiceId: string,
  hostUserId: string,
  patch: {
    requiresApproval?: boolean;
    capacityLimit?: number | null;
    advanceNoticeHours?: number | null;
    availabilityRules?: Prisma.InputJsonValue | null;
    notes?: string | null;
  }
) {
  const row = await prisma.bnhubListingService.update({
    where: { id: listingServiceId },
    data: {
      ...("requiresApproval" in patch ? { requiresApproval: patch.requiresApproval } : {}),
      ...("capacityLimit" in patch ? { capacityLimit: patch.capacityLimit } : {}),
      ...("advanceNoticeHours" in patch ? { advanceNoticeHours: patch.advanceNoticeHours } : {}),
      ...("availabilityRules" in patch ? { availabilityRules: patch.availabilityRules ?? undefined } : {}),
      ...("notes" in patch ? { notes: patch.notes } : {}),
    },
  });
  await logHospitalityAction({
    actorType: "HOST",
    actorId: hostUserId,
    entityType: "BnhubListingService",
    entityId: listingServiceId,
    actionType: "rules_update",
    actionSummary: "Updated listing service rules",
  });
  return row;
}
