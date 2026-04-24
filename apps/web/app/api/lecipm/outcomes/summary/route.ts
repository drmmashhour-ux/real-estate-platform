import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

import { getLecipmOutcomesSummary } from "@/modules/outcomes/outcome.service";

export const dynamic = "force-dynamic";

/**
 * LECIPM feedback loop — aggregate conversion, booking, dispute, and model accuracy (read-only).
 */
export async function GET(request: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const u = new URL(request.url);
  const days = Math.min(90, Math.max(3, parseInt(u.searchParams.get("days") ?? "30", 10) || 30));
  const withPrior = u.searchParams.get("comparePrior") !== "0";

  const summary = await getLecipmOutcomesSummary(days, {
    includeLearning: viewer.role === "ADMIN",
    comparePriorWindow: withPrior,
  });

  if (viewer.role === "BROKER") {
    return NextResponse.json({
      windowDays: summary.windowDays,
      from: summary.from,
      to: summary.to,
      sampleSize: summary.sampleSize,
      conversionRate: summary.conversionRate,
      noShowRate: summary.noShowRate,
      predictionAccuracy: summary.predictionAccuracy,
    });
  }

  return NextResponse.json(summary);
}
