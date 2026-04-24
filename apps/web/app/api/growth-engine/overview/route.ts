import { requireAdmin } from "@/modules/security/access-guard.service";
import { getFunnelSnapshot, identifyFunnelBottlenecks } from "@/modules/growth-autonomy/context.service";
import { prioritizeGrowthChannels } from "@/modules/growth-autonomy/channel-prioritization.engine";
import { buildGrowthActionCandidates } from "@/modules/growth-autonomy/action-candidate-builder";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [snapshot, bottlenecks, channels, actions] = await Promise.all([
      getFunnelSnapshot(),
      identifyFunnelBottlenecks(),
      prioritizeGrowthChannels(),
      buildGrowthActionCandidates(),
    ]);

    return NextResponse.json({
      snapshot,
      bottlenecks,
      channels,
      actions,
    });
  } catch (error) {
    console.error("[growth-engine:api] overview failed", error);
    return NextResponse.json({ error: "Failed to fetch growth overview" }, { status: 500 });
  }
}
