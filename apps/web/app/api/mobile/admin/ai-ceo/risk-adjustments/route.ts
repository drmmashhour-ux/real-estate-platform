import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { generateAiCeoRiskAdjustmentsFromPredictions } from "@/modules/ai-ceo/ai-ceo-risk-adjustment.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const drafts = await generateAiCeoRiskAdjustmentsFromPredictions({ persistProposals: false });
    const persisted = await prisma.lecipmSystemBehaviorAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        title: true,
        status: true,
        affectedDomain: true,
        urgency: true,
        confidence: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      drafts: drafts.drafts,
      persistedAdjustments: persisted.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[mobile/admin/ai-ceo/risk-adjustments]", e);
    return NextResponse.json({ error: "risk_adjustments_failed" }, { status: 500 });
  }
}
