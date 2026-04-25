import { NextRequest } from "next/server";
import { collectAiPipelineMetrics } from "@/lib/ai-data-pipeline";

export const dynamic = "force-dynamic";

/** GET /api/admin/ai/pipeline – run AI data pipeline and return aggregated metrics. */
export async function GET(_request: NextRequest) {
  try {
    const metrics = await collectAiPipelineMetrics();
    return Response.json(metrics);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to collect pipeline metrics" },
      { status: 500 }
    );
  }
}
