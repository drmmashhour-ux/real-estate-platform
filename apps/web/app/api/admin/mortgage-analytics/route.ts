import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { mortgageDistributionScore } from "@/modules/mortgage/services/distribution-score";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const now = new Date();
  const startToday = new Date(now);
  startToday.setUTCHours(0, 0, 0, 0);
  const start7d = new Date(now.getTime() - 7 * 86400000);

  const [
    mortgageLeadsToday,
    mortgageLeads7d,
    closedMortgage7d,
    marketplaceOpen,
    revenue7d,
    experts,
  ] = await Promise.all([
    prisma.lead.count({
      where: { leadType: "mortgage", createdAt: { gte: startToday } },
    }),
    prisma.lead.count({
      where: { leadType: "mortgage", createdAt: { gte: start7d } },
    }),
    prisma.lead.count({
      where: {
        leadType: "mortgage",
        pipelineStatus: "closed",
        dealClosedAt: { gte: start7d },
      },
    }),
    prisma.lead.count({
      where: { leadType: "mortgage", mortgageMarketplaceStatus: "open", assignedExpertId: null },
    }),
    prisma.mortgageDeal.aggregate({
      where: { createdAt: { gte: start7d }, status: { not: "void" } },
      _sum: { platformShare: true, dealAmount: true },
    }),
    prisma.mortgageExpert.findMany({
      where: { isActive: true, acceptedTerms: true },
      include: { expertSubscription: true },
      orderBy: { totalDeals: "desc" },
      take: 20,
    }),
  ]);

  const conversion7d =
    mortgageLeads7d > 0 ? Math.round((closedMortgage7d / mortgageLeads7d) * 1000) / 10 : 0;

  const topExperts = experts
    .map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      rating: e.rating,
      totalDeals: e.totalDeals,
      totalRevenue: e.totalRevenue,
      distributionScore: mortgageDistributionScore({
        rating: e.rating,
        adminRatingBoost: e.adminRatingBoost,
        totalDeals: e.totalDeals,
        priorityWeight: e.expertSubscription?.isActive ? e.expertSubscription.priorityWeight : 0,
        reviewCount: e.reviewCount,
      }),
    }))
    .sort((a, b) => b.distributionScore - a.distributionScore)
    .slice(0, 10);

  return NextResponse.json({
    mortgageLeadsToday,
    mortgageLeads7d,
    closedMortgage7d,
    conversionRate7dPct: conversion7d,
    marketplaceOpenCount: marketplaceOpen,
    revenue7d: {
      platformShare: revenue7d._sum.platformShare ?? 0,
      dealAmount: revenue7d._sum.dealAmount ?? 0,
    },
    topExperts,
  });
}
