import type { CareLevel } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getResidentProfileByUserId(userId: string) {
  return prisma.residentProfile.findUnique({
    where: { userId },
    include: {
      residence: { include: { units: true, services: true, foodPlans: true } },
      foodPlan: true,
      familyAccess: { include: { familyUser: { select: { id: true, email: true, name: true } } } },
    },
  });
}

export async function getResidentProfileById(id: string) {
  return prisma.residentProfile.findUnique({
    where: { id },
    include: {
      residence: true,
      foodPlan: true,
      user: { select: { id: true, email: true, name: true, phone: true } },
    },
  });
}

export async function createResidentProfile(input: {
  userId: string;
  residenceId: string;
  careLevel: CareLevel;
  foodPlanId?: string | null;
  healthNotes?: string | null;
  emergencyContact?: string | null;
}) {
  if (input.foodPlanId) {
    const fp = await prisma.foodPlan.findFirst({
      where: { id: input.foodPlanId, residenceId: input.residenceId },
      select: { id: true },
    });
    if (!fp) throw new Error("foodPlanId must belong to the same residence");
  }

  return prisma.residentProfile.create({
    data: {
      userId: input.userId,
      residenceId: input.residenceId,
      careLevel: input.careLevel,
      foodPlanId: input.foodPlanId ?? null,
      healthNotes: input.healthNotes ?? null,
      emergencyContact: input.emergencyContact ?? null,
    },
    include: { residence: true, foodPlan: true },
  });
}

export async function updateResidentProfile(
  id: string,
  patch: Partial<{
    residenceId: string;
    careLevel: CareLevel;
    foodPlanId: string | null;
    healthNotes: string | null;
    emergencyContact: string | null;
  }>,
) {
  const current = await prisma.residentProfile.findUnique({
    where: { id },
    select: { residenceId: true },
  });
  if (!current) throw new Error("Resident not found");

  const nextResidence = patch.residenceId ?? current.residenceId;
  if (patch.foodPlanId) {
    const fp = await prisma.foodPlan.findFirst({
      where: { id: patch.foodPlanId, residenceId: nextResidence },
      select: { id: true },
    });
    if (!fp) throw new Error("foodPlanId must belong to the residence");
  }

  return prisma.residentProfile.update({
    where: { id },
    data: patch,
    include: { residence: true, foodPlan: true },
  });
}
