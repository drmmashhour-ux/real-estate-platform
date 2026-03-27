import type { BnhubMembershipAudienceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logHospitalityAction } from "./hospitalityAuditService";

export async function listMembershipPlans(audience?: BnhubMembershipAudienceType) {
  return prisma.bnhubMembershipPlan.findMany({
    where: {
      isActive: true,
      ...(audience ? { OR: [{ audienceType: audience }, { audienceType: "UNIVERSAL" }] } : {}),
    },
    orderBy: { priceCents: "asc" },
  });
}

export async function getPlanByCode(membershipCode: string) {
  return prisma.bnhubMembershipPlan.findUnique({ where: { membershipCode } });
}

export async function getUserMembership(userId: string) {
  const now = new Date();
  return prisma.bnhubUserMembership.findFirst({
    where: {
      userId,
      membershipStatus: "ACTIVE",
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    include: { plan: true },
    orderBy: { startsAt: "desc" },
  });
}

export async function getMembershipBenefits(userId: string): Promise<Record<string, unknown>> {
  const m = await getUserMembership(userId);
  if (!m?.plan) return {};
  return (m.plan.benefitsJson as Record<string, unknown>) ?? {};
}

/** Basis points discount on hospitality add-ons (e.g. 500 = 5%). */
export async function getActiveMembershipDiscountBps(userId: string): Promise<number> {
  const m = await getUserMembership(userId);
  const b = (m?.plan.benefitsJson as { serviceDiscountBps?: number }) ?? {};
  return typeof b.serviceDiscountBps === "number" ? b.serviceDiscountBps : 0;
}

export async function checkMembershipBenefitEligibility(userId: string, benefitKey: string): Promise<boolean> {
  const benefits = await getMembershipBenefits(userId);
  return Boolean(benefits[benefitKey]);
}

export async function subscribeUserToPlan(args: {
  userId: string;
  planId: string;
  endsAt?: Date | null;
  actorType: "ADMIN" | "SYSTEM";
  actorId?: string | null;
}) {
  const row = await prisma.bnhubUserMembership.create({
    data: {
      userId: args.userId,
      planId: args.planId,
      startsAt: new Date(),
      endsAt: args.endsAt ?? null,
      membershipStatus: "ACTIVE",
      renewalMode: "MANUAL",
    },
  });
  await logHospitalityAction({
    actorType: args.actorType,
    actorId: args.actorId ?? null,
    entityType: "BnhubUserMembership",
    entityId: row.id,
    actionType: "subscribe",
    actionSummary: `User ${args.userId} subscribed to plan ${args.planId}`,
  });
  return row;
}

export async function cancelMembership(userId: string, membershipId: string) {
  const row = await prisma.bnhubUserMembership.updateMany({
    where: { id: membershipId, userId },
    data: { membershipStatus: "CANCELLED" },
  });
  return row.count > 0;
}

export async function applyMembershipDiscounts(subtotalCents: number, userId: string | null): Promise<number> {
  if (!userId) return subtotalCents;
  const bps = await getActiveMembershipDiscountBps(userId);
  if (bps <= 0) return subtotalCents;
  return Math.max(0, subtotalCents - Math.round((subtotalCents * bps) / 10000));
}
