import { NextResponse } from "next/server";
import { growthKnowledgeGraphFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildKnowledgeGraphInsights } from "@/modules/growth/growth-knowledge-graph-bridge.service";
import { buildGrowthKnowledgeGraph } from "@/modules/growth/growth-knowledge-graph.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthKnowledgeGraphFlags.growthKnowledgeGraphV1) {
    return NextResponse.json({ error: "Growth knowledge graph disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const graph = await buildGrowthKnowledgeGraph();
  if (!graph) {
    return NextResponse.json({ error: "Knowledge graph unavailable" }, { status: 503 });
  }

  const insights = growthKnowledgeGraphFlags.growthKnowledgeGraphBridgeV1
    ? buildKnowledgeGraphInsights(graph)
    : undefined;

  return NextResponse.json({ graph, insights });
}
