import { requireAdmin } from "@/modules/security/access-guard.service";
import { getEmpireStrategicRecommendations } from "@/modules/empire/strategic-allocation.engine";
import { getEmpireOrchestrationPriorities } from "@/modules/empire/orchestration.engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [recommendations, priorities] = await Promise.all([
      getEmpireStrategicRecommendations(),
      getEmpireOrchestrationPriorities(),
    ]);
    return NextResponse.json({ recommendations, priorities });
  } catch (error) {
    console.error("[empire:api] strategy failed", error);
    return NextResponse.json({ error: "Failed to fetch strategy data" }, { status: 500 });
  }
}
