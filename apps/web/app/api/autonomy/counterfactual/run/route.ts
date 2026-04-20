import { NextResponse } from "next/server";
import { runCausalEvaluationPipeline } from "@/modules/autonomy/counterfactual/causal-evaluation.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-counterfactual-secret")?.trim();
    const expected = process.env.AUTONOMY_COUNTERFACTUAL_SECRET?.trim();

    if (expected && authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { actionId?: string };
    const { actionId } = body;

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const pipelineResult = await runCausalEvaluationPipeline(actionId);

    return NextResponse.json({ success: true, result: pipelineResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Counterfactual run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
