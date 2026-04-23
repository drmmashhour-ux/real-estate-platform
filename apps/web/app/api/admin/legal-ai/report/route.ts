import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { aiLegalRiskReportForAdmin } from "@/lib/legal/ai-legal-service";
import { demoLegalRiskReport } from "@/lib/legal/demo-legal-ai";
import { isDemoMode } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      source: "demo" as const,
      report: demoLegalRiskReport.report,
      disclaimer: demoLegalRiskReport.disclaimer,
      violationsSample: [
        { id: "demo-1", hub: "seller", feature: "legal_action_risk", intent: "risk", createdAt: new Date().toISOString() },
        { id: "demo-2", hub: "bnhub", feature: "legal_action_risk", intent: "risk", createdAt: new Date().toISOString() },
      ],
      suspiciousListingsSample: ["demo-listing-fsbo-001", "demo-bnhub-stay-mtl"],
    });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const logs = await prisma.aiInteractionLog.findMany({
    where: { legalContext: true, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      hub: true,
      feature: true,
      intent: true,
      riskLevel: true,
      createdAt: true,
      inputSummary: true,
      outputSummary: true,
    },
  });

  const byFeature: Record<string, number> = {};
  for (const row of logs) {
    byFeature[row.feature] = (byFeature[row.feature] ?? 0) + 1;
  }

  const r = await aiLegalRiskReportForAdmin({
    userId,
    role: "admin",
    stats: {
      windowDays: 7,
      totalLegalAiEvents: logs.length,
      byFeature,
      recentRiskLevels: logs.map((l) => l.riskLevel).filter(Boolean),
    },
  });

  return NextResponse.json({
    ok: true,
    source: r.source,
    report: r.text,
    logs: logs.slice(0, 40),
    totals: { windowDays: 7, count: logs.length, byFeature },
  });
}
