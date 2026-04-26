import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

/** Expert performance snapshot */
export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { expert } = session;

  const now = new Date();
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [leadsAssigned24h, leadsAssigned7d, closed7d, dealsSum] = await Promise.all([
    prisma.lead.count({
      where: { assignedExpertId: expert.id, leadType: "mortgage", createdAt: { gte: start24h } },
    }),
    prisma.lead.count({
      where: { assignedExpertId: expert.id, leadType: "mortgage", createdAt: { gte: start7d } },
    }),
    prisma.lead.count({
      where: {
        assignedExpertId: expert.id,
        leadType: "mortgage",
        pipelineStatus: { in: ["closed", "won"] },
        dealClosedAt: { gte: start7d },
      },
    }),
    prisma.mortgageDeal.aggregate({
      where: { expertId: expert.id, status: { not: "void" } },
      _sum: { dealAmount: true, platformShare: true },
      _count: true,
    }),
  ]);

  const openLeads = await prisma.lead.count({
    where: {
      assignedExpertId: expert.id,
      leadType: "mortgage",
      pipelineStatus: { notIn: ["closed", "lost", "won"] },
    },
  });

  const conversion =
    leadsAssigned7d > 0 ? Math.round((closed7d / leadsAssigned7d) * 1000) / 10 : null;

  return NextResponse.json({
    expert: {
      rating: expert.rating,
      reviewCount: expert.reviewCount,
      totalDeals: expert.totalDeals,
      totalRevenue: expert.totalRevenue,
      currentLeadsToday: expert.currentLeadsToday,
      maxLeadsPerDay: expert.maxLeadsPerDay,
    },
    period: {
      leadsAssigned24h,
      leadsAssigned7d,
      closed7d,
      openLeads,
      conversionPct: conversion,
    },
    allTime: {
      dealsRecorded: dealsSum._count,
      dealVolume: dealsSum._sum.dealAmount ?? 0,
      platformShare: dealsSum._sum.platformShare ?? 0,
    },
    subscription: expert.expertSubscription ?? null,
    credits: expert.expertCredits ?? null,
  });
}
