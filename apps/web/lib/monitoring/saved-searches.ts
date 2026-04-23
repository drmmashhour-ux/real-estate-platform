import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createSavedSearch(data: Prisma.MonitoringSavedSearchCreateInput) {
  return prisma.monitoringSavedSearch.create({ data });
}

export async function listSavedSearches(ownerType: string, ownerId: string) {
  return prisma.monitoringSavedSearch.findMany({
    where: { ownerType, ownerId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSavedSearchForOwner(id: string, ownerType: string, ownerId: string) {
  return prisma.monitoringSavedSearch.findFirst({
    where: { id, ownerType, ownerId },
  });
}
