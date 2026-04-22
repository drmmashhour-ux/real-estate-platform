import type {
  CareFoodPlanTier,
  CareLevel,
  CareResidenceType,
  CareServiceKind,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";

import { calculateMonthlyCost } from "./soins-pricing.service";

const residenceInclude = {
  units: true,
  services: true,
  foodPlans: true,
} satisfies Prisma.CareResidenceInclude;

export type CareResidenceDetail = Prisma.CareResidenceGetPayload<{ include: typeof residenceInclude }>;

export async function listCareResidences(filter?: { city?: string }) {
  return prisma.careResidence.findMany({
    where: filter?.city ? { city: filter.city } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      units: true,
      foodPlans: true,
      services: true,
      _count: { select: { residents: true } },
    },
  });
}

export async function getCareResidence(id: string): Promise<CareResidenceDetail | null> {
  return prisma.careResidence.findUnique({
    where: { id },
    include: residenceInclude,
  });
}

export async function createCareResidence(input: {
  title: string;
  description?: string | null;
  city: string;
  address: string;
  type: CareResidenceType;
  basePrice: number;
  operatorId?: string | null;
  units?: { title: string; price: number; availability?: boolean; roomType: string }[];
  services?: { name: string; type: CareServiceKind; price: number; requiredLevel: CareLevel }[];
  foodPlans?: { name: CareFoodPlanTier; mealsPerDay: number; price: number }[];
}) {
  return prisma.careResidence.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      city: input.city,
      address: input.address,
      type: input.type,
      basePrice: input.basePrice,
      operatorId: input.operatorId ?? null,
      units: input.units?.length
        ? {
            create: input.units.map((u) => ({
              title: u.title,
              price: u.price,
              availability: u.availability ?? true,
              roomType: u.roomType,
            })),
          }
        : undefined,
      services: input.services?.length
        ? {
            create: input.services.map((s) => ({
              name: s.name,
              type: s.type,
              price: s.price,
              requiredLevel: s.requiredLevel,
            })),
          }
        : undefined,
      foodPlans: input.foodPlans?.length
        ? {
            create: input.foodPlans.map((f) => ({
              name: f.name,
              mealsPerDay: f.mealsPerDay,
              price: f.price,
            })),
          }
        : undefined,
    },
    include: residenceInclude,
  });
}

export async function updateCareResidence(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    city: string;
    address: string;
    type: CareResidenceType;
    basePrice: number;
    operatorId: string | null;
  }>,
) {
  return prisma.careResidence.update({
    where: { id },
    data: patch,
    include: residenceInclude,
  });
}

export async function deleteCareResidence(id: string) {
  await prisma.careResidence.delete({ where: { id } });
}

export async function upsertCareUnit(
  residenceId: string,
  unit: { id?: string; title: string; price: number; availability?: boolean; roomType: string },
) {
  if (unit.id) {
    return prisma.careUnit.update({
      where: { id: unit.id },
      data: {
        title: unit.title,
        price: unit.price,
        availability: unit.availability ?? true,
        roomType: unit.roomType,
      },
    });
  }
  return prisma.careUnit.create({
    data: {
      residenceId,
      title: unit.title,
      price: unit.price,
      availability: unit.availability ?? true,
      roomType: unit.roomType,
    },
  });
}

export async function deleteCareUnit(unitId: string) {
  await prisma.careUnit.delete({ where: { id: unitId } });
}

export async function upsertCareService(
  residenceId: string,
  row: { id?: string; name: string; type: CareServiceKind; price: number; requiredLevel: CareLevel },
) {
  if (row.id) {
    return prisma.careService.update({
      where: { id: row.id },
      data: {
        name: row.name,
        type: row.type,
        price: row.price,
        requiredLevel: row.requiredLevel,
      },
    });
  }
  return prisma.careService.create({
    data: {
      residenceId,
      name: row.name,
      type: row.type,
      price: row.price,
      requiredLevel: row.requiredLevel,
    },
  });
}

export async function deleteCareService(serviceId: string) {
  await prisma.careService.delete({ where: { id: serviceId } });
}

export async function upsertFoodPlan(
  residenceId: string,
  row: { id?: string; name: CareFoodPlanTier; mealsPerDay: number; price: number },
) {
  if (row.id) {
    return prisma.foodPlan.update({
      where: { id: row.id },
      data: {
        name: row.name,
        mealsPerDay: row.mealsPerDay,
        price: row.price,
      },
    });
  }
  return prisma.foodPlan.create({
    data: {
      residenceId,
      name: row.name,
      mealsPerDay: row.mealsPerDay,
      price: row.price,
    },
  });
}

export async function deleteFoodPlan(planId: string) {
  await prisma.foodPlan.delete({ where: { id: planId } });
}

/** Loads resident + residence catalog and returns pricing estimate. */
export async function estimateMonthlyForResident(
  residentId: string,
  opts?: { unitPrice?: number },
) {
  const profile = await prisma.residentProfile.findUnique({
    where: { id: residentId },
    include: {
      foodPlan: true,
      residence: {
        include: { services: true, units: { take: 1, orderBy: { price: "asc" } } },
      },
    },
  });
  if (!profile) return null;

  const base =
    opts?.unitPrice ??
    profile.residence.units[0]?.price ??
    profile.residence.basePrice;

  return calculateMonthlyCost({
    basePrice: base,
    careLevel: profile.careLevel,
    foodPlan: profile.foodPlan,
    services: profile.residence.services,
  });
}
