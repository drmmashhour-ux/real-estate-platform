import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireListingOwnerOrAdmin } from "@/lib/autopilot/listing-guard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await ctx.params;
  const gate = await requireListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const [pending, recentApplied, recentRuns, audits] = await Promise.all([
    prisma.listingOptimizationSuggestion.findMany({
      where: { listingId, status: "suggested" },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.listingOptimizationSuggestion.findMany({
      where: { listingId, status: "applied" },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        fieldType: true,
        currentValue: true,
        proposedValue: true,
        reason: true,
        riskLevel: true,
        updatedAt: true,
      },
    }),
    prisma.listingOptimizationRun.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, status: true, summary: true, createdAt: true },
    }),
    prisma.listingOptimizationAudit.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return NextResponse.json({
    pending,
    recentApplied,
    recentRuns,
    audits,
  });
}
