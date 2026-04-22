import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ListResidencesFilters } from "./senior.types";

export async function createResidence(input: {
  name: string;
  description?: string | null;
  address: string;
  city: string;
  province: string;
  operatorId?: string | null;
  careLevel: string;
  has24hStaff?: boolean;
  medicalSupport?: boolean;
  mealsIncluded?: boolean;
  activitiesIncluded?: boolean;
  basePrice?: number | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return prisma.seniorResidence.create({
    data: {
      name: input.name.trim().slice(0, 512),
      description: input.description?.trim() ?? null,
      address: input.address.trim().slice(0, 512),
      city: input.city.trim().slice(0, 160),
      province: input.province.trim().slice(0, 80),
      operatorId: input.operatorId ?? null,
      careLevel: input.careLevel.slice(0, 40),
      has24hStaff: input.has24hStaff ?? false,
      medicalSupport: input.medicalSupport ?? false,
      mealsIncluded: input.mealsIncluded ?? false,
      activitiesIncluded: input.activitiesIncluded ?? false,
      basePrice: input.basePrice ?? undefined,
      priceRangeMin: input.priceRangeMin ?? undefined,
      priceRangeMax: input.priceRangeMax ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
    },
  });
}

export async function updateResidence(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    address: string;
    city: string;
    province: string;
    operatorId: string | null;
    careLevel: string;
    has24hStaff: boolean;
    medicalSupport: boolean;
    mealsIncluded: boolean;
    activitiesIncluded: boolean;
    basePrice: number | null;
    priceRangeMin: number | null;
    priceRangeMax: number | null;
    verified: boolean;
    rating: number | null;
    latitude: number | null;
    longitude: number | null;
  }>
) {
  const patch: Prisma.SeniorResidenceUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name.trim().slice(0, 512);
  if (data.description !== undefined) patch.description = data.description?.trim() ?? null;
  if (data.address !== undefined) patch.address = data.address.trim().slice(0, 512);
  if (data.city !== undefined) patch.city = data.city.trim().slice(0, 160);
  if (data.province !== undefined) patch.province = data.province.trim().slice(0, 80);
  if (data.operatorId !== undefined) patch.operatorId = data.operatorId;
  if (data.careLevel !== undefined) patch.careLevel = data.careLevel.slice(0, 40);
  if (data.has24hStaff !== undefined) patch.has24hStaff = data.has24hStaff;
  if (data.medicalSupport !== undefined) patch.medicalSupport = data.medicalSupport;
  if (data.mealsIncluded !== undefined) patch.mealsIncluded = data.mealsIncluded;
  if (data.activitiesIncluded !== undefined) patch.activitiesIncluded = data.activitiesIncluded;
  if (data.basePrice !== undefined) patch.basePrice = data.basePrice;
  if (data.priceRangeMin !== undefined) patch.priceRangeMin = data.priceRangeMin;
  if (data.priceRangeMax !== undefined) patch.priceRangeMax = data.priceRangeMax;
  if (data.verified !== undefined) patch.verified = data.verified;
  if (data.rating !== undefined) patch.rating = data.rating;
  if (data.latitude !== undefined) patch.latitude = data.latitude;
  if (data.longitude !== undefined) patch.longitude = data.longitude;

  return prisma.seniorResidence.update({
    where: { id },
    data: patch,
  });
}

export async function getResidence(id: string) {
  return prisma.seniorResidence.findUnique({
    where: { id },
    include: {
      units: true,
      servicesOffered: true,
      operator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listResidences(filters: ListResidencesFilters = {}) {
  const take = Math.min(filters.take ?? 80, 200);
  const where: Prisma.SeniorResidenceWhereInput = {};

  if (filters.city?.trim()) where.city = { equals: filters.city.trim(), mode: "insensitive" };
  if (filters.province?.trim()) where.province = { equals: filters.province.trim(), mode: "insensitive" };
  if (filters.careLevel?.trim()) where.careLevel = filters.careLevel.trim();
  if (filters.verifiedOnly) where.verified = true;

  if (filters.priceMin != null || filters.priceMax != null) {
    const orPrice: Prisma.SeniorResidenceWhereInput[] = [];
    const min = filters.priceMin;
    const max = filters.priceMax;
    if (min != null && max != null) {
      orPrice.push({
        AND: [{ priceRangeMin: { lte: max } }, { priceRangeMax: { gte: min } }],
      });
      orPrice.push({ basePrice: { gte: min, lte: max } });
    } else if (min != null) {
      orPrice.push({ OR: [{ priceRangeMax: { gte: min } }, { basePrice: { gte: min } }] });
    } else if (max != null) {
      orPrice.push({ OR: [{ priceRangeMin: { lte: max } }, { basePrice: { lte: max } }] });
    }
    if (orPrice.length) where.AND = [...(where.AND as Prisma.SeniorResidenceWhereInput[] | undefined ?? []), { OR: orPrice }];
  }

  if (filters.serviceCategory?.trim() || filters.serviceNameContains?.trim()) {
    where.servicesOffered = {
      some: {
        ...(filters.serviceCategory?.trim() ? { category: filters.serviceCategory.trim() } : {}),
        ...(filters.serviceNameContains?.trim() ?
          { name: { contains: filters.serviceNameContains.trim(), mode: "insensitive" } }
        : {}),
      },
    };
  }

  return prisma.seniorResidence.findMany({
    where,
    take,
    orderBy: [{ verified: "desc" }, { rating: "desc" }, { name: "asc" }],
    include: {
      units: { where: { available: true }, take: 8 },
      servicesOffered: { take: 12 },
    },
  });
}
