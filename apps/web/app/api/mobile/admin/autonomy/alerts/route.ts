import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Fetch critical policy events or high-risk actions
    const alerts = await prisma.autonomousActionQueue.findMany({
      where: {
        riskLevel: "HIGH",
        status: "QUEUED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const govState = await prisma.managerAiAutonomyGovernanceState.findUnique({
      where: { id: "singleton" },
    });

    const systemAlerts = [];
    if (govState?.recommendedPause) {
      systemAlerts.push({
        type: "SYSTEM_PAUSE_RECOMMENDED",
        severity: "HIGH",
        message: "Governance engine recommends pausing autonomy due to recent performance deltas.",
      });
    }

    return NextResponse.json({
      actionAlerts: alerts.map(a => ({
        id: a.id,
        message: `High risk ${a.actionType} in ${a.domain} requires immediate review.`,
        createdAt: a.createdAt,
      })),
      systemAlerts,
    });
  } catch (error) {
    console.error("Failed to get mobile alerts", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
