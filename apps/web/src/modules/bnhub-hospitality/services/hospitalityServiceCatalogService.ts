import type { BnhubAddonServiceCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listGuestVisibleListingServices } from "@/lib/bnhub/hospitality-addons";

export async function listGlobalServices(args?: { activeOnly?: boolean }) {
  return prisma.bnhubService.findMany({
    where: args?.activeOnly === false ? {} : { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getServiceByCode(serviceCode: string) {
  return prisma.bnhubService.findUnique({ where: { serviceCode } });
}

export async function listServicesByCategory(category: BnhubAddonServiceCategory) {
  return prisma.bnhubService.findMany({
    where: { category, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function listServicesForListing(listingId: string) {
  return prisma.bnhubListingService.findMany({
    where: { listingId },
    include: { service: true },
    orderBy: [{ service: { category: "asc" } }, { service: { name: "asc" } }],
  });
}

/** Safe guest-facing offers (trust + moderation applied). */
export async function listPublicServicesForListing(listingId: string) {
  return listGuestVisibleListingServices(listingId);
}
