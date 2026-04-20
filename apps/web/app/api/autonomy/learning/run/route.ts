import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { runLearningCycle } from "@/modules/autonomy/learning/learning-cycle.service";

export const dynamic = "force-dynamic";

/**
 * Runs deterministic outcome evaluation + bounded rule-weight updates.
 * Auth: `x-learning-secret` matching `AUTONOMY_LEARNING_SECRET`, or platform admin session.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-learning-secret")?.trim();
    const expected = process.env.AUTONOMY_LEARNING_SECRET?.trim();
    const secretOk = Boolean(expected && authHeader === expected);

    if (!secretOk) {
      const auth = await requireRole("admin");
      if (!auth.ok) return auth.response;
    }

    const { results, evaluatedCount } = await runLearningCycle();

    return NextResponse.json({
      success: true,
      evaluated: evaluatedCount,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Learning cycle failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
