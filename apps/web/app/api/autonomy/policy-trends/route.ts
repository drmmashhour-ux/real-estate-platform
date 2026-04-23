import { NextResponse } from "next/server";
import { getAutonomyPolicyTrends } from "@/modules/autonomy/analytics/autonomy-policy-trends.service";

export async function GET() {
  try {
    const data = await getAutonomyPolicyTrends();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get policy trends", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
