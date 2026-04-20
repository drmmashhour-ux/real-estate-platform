import { NextResponse } from "next/server";
import { runDueCounterfactualEvaluations } from "@/modules/autonomy/counterfactual/counterfactual-batch.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  try {
    const authHeader = req.headers.get("x-counterfactual-secret")?.trim();
    const expected = process.env.AUTONOMY_COUNTERFACTUAL_SECRET?.trim();

    if (expected && authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await runDueCounterfactualEvaluations();

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Batch counterfactual run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
