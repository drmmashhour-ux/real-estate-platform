import { NextResponse } from "next/server";
import { growthMemoryFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthMemorySummary } from "@/modules/growth/growth-memory.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthMemoryFlags.growthMemoryV1) {
    return NextResponse.json({ error: "Growth memory disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const summary = await buildGrowthMemorySummary();
  if (!summary) {
    return NextResponse.json({ error: "Growth memory summary unavailable" }, { status: 503 });
  }

  return NextResponse.json({ summary });
}
