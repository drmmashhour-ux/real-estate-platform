import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { LecipmLaunchPlan } from "./lecipm-launch-constants";

function normalizePlan(p: string): LecipmLaunchPlan {
  const u = p.trim().toUpperCase();
  if (u === "FREE" || u === "PRO" || u === "AGENCY" || u === "ENTERPRISE") return u;
  return "FREE";
}

/**
 * Stripe broker LECIPM subscription (`brokerLecipmSubscription`) upgrades effective launch tier when active.
 */
async function stripeBoostedPlan(userId: string): Promise<LecipmLaunchPlan | null> {
  const sub = await prisma.brokerLecipmSubscription.findUnique({
    where: { userId },
    select: { status: true, planSlug: true },
  });
  if (!sub || !["active", "trialing"].includes(sub.status.toLowerCase())) return null;
  const slug = sub.planSlug?.toLowerCase() ?? "";
  if (slug.includes("platinum")) return "ENTERPRISE";
  if (slug.includes("pro")) return "PRO";
  return "PRO";
}

export async function getOrCreateLaunchSubscription(userId: string) {
  let row = await prisma.lecipmBrokerLaunchSubscription.findUnique({
    where: { userId },
  });
  if (!row) {
    row = await prisma.lecipmBrokerLaunchSubscription.create({
      data: { userId, plan: "FREE", status: "ACTIVE" },
    });
  }
  return row;
}

export async function getEffectiveLaunchPlan(userId: string): Promise<LecipmLaunchPlan> {
  const stripe = await stripeBoostedPlan(userId);
  if (stripe) return stripe;
  const row = await getOrCreateLaunchSubscription(userId);
  return normalizePlan(row.plan);
}

export async function setLaunchPlan(userId: string, plan: LecipmLaunchPlan, status = "ACTIVE") {
  await prisma.lecipmBrokerLaunchSubscription.upsert({
    where: { userId },
    create: { userId, plan, status },
    update: { plan, status },
  });
}

/** Admin bypass for billing gates. */
export function billingGateApplies(actorRole: PlatformRole): boolean {
  return actorRole !== "ADMIN";
}
