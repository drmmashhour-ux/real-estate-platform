import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getBrokerApiSession } from "@/modules/mortgage/services/broker-dashboard-api";
import { FREE_BROKER_VISIBLE_LEADS } from "@/modules/mortgage/services/broker-lead-limits";
import { mapBrokerLeadRows } from "@/modules/mortgage/services/map-broker-lead";
import {
  countProFreeWeeklyUnlocks,
  PRO_WEEKLY_FREE_CONTACT_UNLOCKS,
} from "@/modules/mortgage/services/mortgage-unlock-weekly";

export const dynamic = "force-dynamic";

const VALUE_PROPOSITION = "High-intent, qualified real estate leads";
const CONFIDENCE_LINE = "Leads generated from real investment analysis";

export async function GET() {
  const session = await getBrokerApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const where = session.isAdmin ? {} : { brokerId: session.brokerId };

  const rows = await prisma.mortgageRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      userId: true,
      propertyPrice: true,
      downPayment: true,
      income: true,
      status: true,
      createdAt: true,
      intentLevel: true,
      timeline: true,
      preApproved: true,
      estimatedApprovalAmount: true,
      estimatedMonthlyPayment: true,
      approvalConfidence: true,
      leadValue: true,
      contactUnlocked: true,
      unlockedByBrokerId: true,
      user: {
        select: {
          email: true,
          phone: true,
          name: true,
        },
      },
    },
  });

  if (session.isAdmin) {
    const mapped = mapBrokerLeadRows(rows, { plan: "admin", isAdmin: true, brokerId: null });
    return NextResponse.json({
      plan: "admin",
      totalLeads: rows.length,
      visibleLimit: null,
      lockedCount: 0,
      valueProposition: VALUE_PROPOSITION,
      confidenceLine: CONFIDENCE_LINE,
      requests: mapped,
    });
  }

  const plan = session.plan;
  const unlockedCount =
    plan === "pro" ? rows.length : Math.min(FREE_BROKER_VISIBLE_LEADS, rows.length);

  const usedFreeWeekly = await countProFreeWeeklyUnlocks(session.brokerId);

  const brokerAnalytics = await prisma.mortgageBroker.update({
    where: { id: session.brokerId },
    data: {
      leadsViewedTotal: { increment: unlockedCount },
    },
    select: {
      leadsViewedTotal: true,
      upgradeClickCount: true,
      totalLeadUnlocks: true,
      totalLeadUnlockRevenue: true,
    },
  });

  const lockedCount =
    plan === "pro" ? 0 : Math.max(0, rows.length - FREE_BROKER_VISIBLE_LEADS);

  const mapped = mapBrokerLeadRows(rows, { plan, isAdmin: false, brokerId: session.brokerId });

  const weeklyFreeUnlocksRemaining =
    plan === "pro" ? Math.max(0, PRO_WEEKLY_FREE_CONTACT_UNLOCKS - usedFreeWeekly) : 0;

  return NextResponse.json({
    plan,
    totalLeads: rows.length,
    visibleLimit: plan === "pro" ? null : FREE_BROKER_VISIBLE_LEADS,
    lockedCount,
    weeklyFreeUnlocksRemaining,
    valueProposition: VALUE_PROPOSITION,
    confidenceLine: CONFIDENCE_LINE,
    analytics: {
      leadsViewedTotal: brokerAnalytics.leadsViewedTotal,
      upgradeClickCount: brokerAnalytics.upgradeClickCount,
      totalLeadUnlocks: brokerAnalytics.totalLeadUnlocks,
      totalLeadUnlockRevenue: brokerAnalytics.totalLeadUnlockRevenue,
    },
    requests: mapped,
  });
}
