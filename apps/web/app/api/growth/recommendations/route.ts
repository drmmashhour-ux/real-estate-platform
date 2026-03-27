import { NextResponse } from "next/server";
import { generateOptimizationRecommendations } from "@/src/modules/growth-automation/analytics/generateOptimizationRecommendations";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const recommendations = await generateOptimizationRecommendations();
  return NextResponse.json({ recommendations });
}
