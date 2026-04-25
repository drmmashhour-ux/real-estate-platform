import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [active, pendingApprovals, recentOutcomes] = await Promise.all([
    prisma.growthBrainRecommendation.findMany({
      where: { status: "active" },
      orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
      take: 120,
    }),
    prisma.growthBrainApproval.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { recommendation: true },
    }),
    prisma.growthBrainOutcomeEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { recommendation: { select: { title: true, domain: true, priority: true } } },
    }),
  ]);

  return NextResponse.json({
    recommendations: active,
    pendingApprovals,
    recentOutcomes,
  });
}
