/**
 * Market regions – CRUD and property mapping.
 */

import { prisma } from "@/lib/db";
import type { MarketRegionInput } from "./types";
import type { RegionType } from "./types";

export async function listRegions(params?: {
  regionType?: RegionType;
  country?: string;
  province?: string;
  parentRegionId?: string | null;
}) {
  return prisma.marketRegion.findMany({
    where: {
      ...(params?.regionType && { regionType: params.regionType }),
      ...(params?.country && { country: params.country }),
      ...(params?.province && { province: params.province }),
      ...(params?.parentRegionId !== undefined && { parentRegionId: params.parentRegionId }),
    },
    include: { parentRegion: { select: { id: true, name: true, regionType: true } } },
    orderBy: [{ regionType: "asc" }, { name: "asc" }],
  });
}

export async function getRegion(id: string) {
  return prisma.marketRegion.findUnique({
    where: { id },
    include: {
      parentRegion: true,
      childRegions: { select: { id: true, name: true, regionType: true } },
      _count: { select: { propertyIdentities: true } },
    },
  });
}

export async function createRegion(input: MarketRegionInput) {
  return prisma.marketRegion.create({
    data: {
      name: input.name.trim(),
      regionType: input.regionType,
      parentRegionId: input.parentRegionId ?? undefined,
      country: input.country ?? "US",
      province: input.province ?? undefined,
    },
  });
}

export async function assignPropertyToRegion(propertyIdentityId: string, marketRegionId: string) {
  const [prop, region] = await Promise.all([
    prisma.propertyIdentity.findUnique({ where: { id: propertyIdentityId } }),
    prisma.marketRegion.findUnique({ where: { id: marketRegionId } }),
  ]);
  if (!prop) throw new Error("Property identity not found");
  if (!region) throw new Error("Market region not found");
  return prisma.propertyIdentity.update({
    where: { id: propertyIdentityId },
    data: { marketRegionId },
  });
}

export async function getRegionPropertyIds(marketRegionId: string): Promise<string[]> {
  const rows = await prisma.propertyIdentity.findMany({
    where: { marketRegionId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Resolve or create a region by municipality/province/country (e.g. for aggregations). */
export async function findOrCreateRegionByLocation(params: {
  municipality?: string | null;
  province?: string | null;
  country?: string;
}): Promise<string | null> {
  const name = [params.municipality, params.province].filter(Boolean).join(", ") || params.country || "Unknown";
  if (!name || name === "Unknown") return null;
  const country = params.country ?? "US";
  const province = params.province ?? null;
  const existing = await prisma.marketRegion.findFirst({
    where: { name, country, province: province ?? undefined, regionType: "municipality" },
  });
  if (existing) return existing.id;
  const created = await prisma.marketRegion.create({
    data: { name, regionType: "municipality", country, province },
  });
  return created.id;
}
