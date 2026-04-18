import { NextResponse } from "next/server";
import { listGrowthRecommendations } from "@/modules/growth-automation";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  const recs = await listGrowthRecommendations(auth.userId);
  return NextResponse.json({ recommendations: recs });
}
