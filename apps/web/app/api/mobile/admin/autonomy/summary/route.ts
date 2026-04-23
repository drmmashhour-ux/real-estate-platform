import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getAutonomyModeRecommendation } from "@/modules/autonomy/services/autonomy-mode-recommendation.service";

export async function GET() {
  try {
    const govState = await prisma.managerAiAutonomyGovernanceState.findUnique({
      where: { id: "singleton" },
    });

    const recommendation = await getAutonomyModeRecommendation();

    return NextResponse.json({
      mode: govState?.mode || "ASSIST",
      isPaused: govState?.paused || false,
      executedToday: govState?.executedToday || 0,
      pendingApprovals: govState?.pendingApprovals || 0,
      recommendedMode: recommendation.suggestedMode,
      recommendationReason: recommendation.reason,
    });
  } catch (error) {
    console.error("Failed to get mobile autonomy summary", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
