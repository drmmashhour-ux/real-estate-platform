import { prisma } from "@/lib/db";
import type { UserPlanResolution } from "@/src/modules/billing-conversion/domain/billing.types";
import type { ConversionPlanCode } from "@/src/modules/billing-conversion/domain/billing.enums";
import { findSubscriptionByUserId } from "@/src/modules/billing-conversion/infrastructure/subscriptionRepository";

const ACTIVE = new Set(["trial", "active"]);

export async function getUserPlan(userId: string): Promise<UserPlanResolution> {
  const sub = await findSubscriptionByUserId(userId);
  if (sub && ACTIVE.has(sub.status) && sub.plan?.code) {
    return { planCode: sub.plan.code as ConversionPlanCode, source: "subscription" };
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!u) {
    return { planCode: "free", source: "default" };
  }

  if (u.plan === "pro" || u.plan === "basic") {
    return { planCode: "pro", source: "legacy_user_plan" };
  }
  if (u.plan === "team") {
    return { planCode: "team", source: "legacy_user_plan" };
  }

  return { planCode: "free", source: "default" };
}
