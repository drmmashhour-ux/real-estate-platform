import { NextResponse } from "next/server";
import { getAutonomyModeRecommendation } from "@/modules/autonomy/services/autonomy-mode-recommendation.service";

export async function GET() {
  try {
    const recommendation = await getAutonomyModeRecommendation();
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Failed to get mode recommendation", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
