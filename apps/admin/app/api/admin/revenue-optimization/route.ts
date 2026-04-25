import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

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
  const start30 = new Date(now.getTime() - 30 * 86400000);

  const [
    mortgageLeads30,
    closed30,
    revenue30,
    tiers,
    abVariants,
    topRegions,
    topExpertsRaw,
  ] = await Promise.all([
    prisma.lead.count({
      where: { leadType: "mortgage", createdAt: { gte: start30 } },
    }),
    prisma.lead.count({
      where: {
        leadType: "mortgage",
        pipelineStatus: "closed",
        dealClosedAt: { gte: start30 },
      },
    }),
    prisma.mortgageDeal.aggregate({
      where: { createdAt: { gte: start30 }, status: { not: "void" } },
      _sum: { platformShare: true, dealAmount: true },
    }),
    prisma.lead.groupBy({
      by: ["revenueTier"],
      where: { leadType: "mortgage", createdAt: { gte: start30 } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["revenueAbVariant"],
      where: { leadType: "mortgage", createdAt: { gte: start30 } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["purchaseRegion"],
      where: {
        leadType: "mortgage",
        createdAt: { gte: start30 },
        purchaseRegion: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { purchaseRegion: "desc" } },
      take: 12,
    }),
    prisma.mortgageDeal.groupBy({
      by: ["expertId"],
      where: { createdAt: { gte: start30 }, status: { not: "void" } },
      _sum: { platformShare: true, dealAmount: true },
      _count: { _all: true },
      orderBy: { _sum: { platformShare: "desc" } },
      take: 12,
    }),
  ]);

  const regionsFiltered = topRegions.filter((r) => r.purchaseRegion && r.purchaseRegion.trim().length > 0);

  const expertIds = topExpertsRaw.map((r) => r.expertId);
  const experts = await prisma.mortgageExpert.findMany({
    where: { id: { in: expertIds } },
    select: { id: true, name: true, email: true, totalDeals: true, rating: true },
  });
  const nameById = Object.fromEntries(experts.map((e) => [e.id, e]));

  const conversionPct =
    mortgageLeads30 > 0 ? Math.round((closed30 / mortgageLeads30) * 1000) / 10 : 0;
  const platformRev = revenue30._sum.platformShare ?? 0;
  const revenuePerLead = mortgageLeads30 > 0 ? Math.round((platformRev / mortgageLeads30) * 100) / 100 : 0;

  const topExperts = topExpertsRaw.map((row) => ({
    expertId: row.expertId,
    name: nameById[row.expertId]?.name ?? "—",
    email: nameById[row.expertId]?.email ?? "",
    deals: row._count._all,
    platformShare: row._sum.platformShare ?? 0,
    dealVolume: row._sum.dealAmount ?? 0,
    rating: nameById[row.expertId]?.rating ?? 0,
    totalDeals: nameById[row.expertId]?.totalDeals ?? 0,
  }));

  return NextResponse.json({
    windowDays: 30,
    mortgageLeads30,
    closed30,
    conversionRatePct: conversionPct,
    revenuePerLeadDollars: revenuePerLead,
    platformShare30: platformRev,
    dealVolume30: revenue30._sum.dealAmount ?? 0,
    tiers: tiers.map((t) => ({ tier: t.revenueTier ?? "unset", count: t._count._all })),
    abVariants: abVariants.map((a) => ({ variant: a.revenueAbVariant ?? "unset", leads: a._count._all })),
    topRegions: regionsFiltered.map((r) => ({
      region: r.purchaseRegion ?? "",
      leads: r._count._all,
    })),
    topExperts,
  });
}
