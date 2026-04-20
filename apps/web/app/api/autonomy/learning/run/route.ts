import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { runLearningCycle } from "@/modules/autonomy/learning/learning-cycle.service";

export const dynamic = "force-dynamic";

async function authorizeLearning(req: Request): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const authHeader = req.headers.get("x-learning-secret")?.trim();
  const expectedSecret = process.env.AUTONOMY_LEARNING_SECRET?.trim();
  if (expectedSecret && authHeader === expectedSecret) {
    return { ok: true };
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (cronSecret && bearer === cronSecret) {
    return { ok: true };
  }

  const admin = await requireRole("admin");
  if (!admin.ok) return { ok: false, response: admin.response };
  return { ok: true };
}

async function handle() {
  const { results, evaluatedCount } = await runLearningCycle();
  return NextResponse.json({
    success: true,
    evaluated: evaluatedCount,
    results,
  });
}

/**
 * Runs deterministic outcome evaluation, optional counterfactual uplift estimate, then bounded rule-weight / contextual updates
 * (prefers uplift-adjusted reward when stored).
 * Auth: `x-learning-secret` = `AUTONOMY_LEARNING_SECRET`, or `Authorization: Bearer` `CRON_SECRET`, or admin session.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = await authorizeLearning(req);
    if (!gate.ok) return gate.response;
    return await handle();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Learning cycle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const gate = await authorizeLearning(req);
    if (!gate.ok) return gate.response;
    return await handle();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Learning cycle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
