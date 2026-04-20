import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { computeExperimentResults } from "@/modules/autonomy/experiment/experiment-analysis.service";
import { recordAllExperimentOutcomes } from "@/modules/autonomy/experiment/experiment-outcome.service";
import { runExperimentFullPipeline } from "@/modules/autonomy/experiment/experiment-run.service";

export const dynamic = "force-dynamic";

function authorize(req: Request) {
  const expected = process.env.AUTONOMY_EXPERIMENT_SECRET?.trim();
  const header = req.headers.get("x-autonomy-experiment-secret")?.trim();
  if (expected && header === expected) {
    return { ok: true as const };
  }
  return null;
}

type Action = "record" | "analyze" | "complete" | "record_and_analyze";

export async function POST(req: Request) {
  try {
    const direct = authorize(req);
    if (!direct) {
      const admin = await requireRole("admin");
      if (!admin.ok) return admin.response;
    }

    const body = (await req.json()) as { experimentId?: string; action?: Action };
    if (!body.experimentId) {
      return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
    }

    const action: Action = body.action ?? "record_and_analyze";

    switch (action) {
      case "record": {
        const r = await recordAllExperimentOutcomes(body.experimentId);
        return NextResponse.json({ success: true, result: r });
      }
      case "analyze": {
        const row = await computeExperimentResults(body.experimentId);
        return NextResponse.json({ success: true, result: row });
      }
      case "record_and_analyze": {
        await recordAllExperimentOutcomes(body.experimentId);
        const row = await computeExperimentResults(body.experimentId);
        return NextResponse.json({ success: true, result: row });
      }
      case "complete": {
        const r = await runExperimentFullPipeline(body.experimentId);
        return NextResponse.json({ success: true, result: r });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
