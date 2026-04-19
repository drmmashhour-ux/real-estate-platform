import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildAdaptiveIntelligenceSnapshot } from "@/modules/growth/adaptive-intelligence.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.adaptiveIntelligenceV1) {
    return NextResponse.json({ error: "Adaptive intelligence is disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const snapshot = await buildAdaptiveIntelligenceSnapshot();
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("[adaptive-intelligence]", e);
    return NextResponse.json({ error: "Failed to build adaptive snapshot" }, { status: 500 });
  }
}
