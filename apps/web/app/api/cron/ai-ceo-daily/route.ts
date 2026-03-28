import { NextRequest } from "next/server";
import { runAiCeoDailyCycle } from "@/src/modules/ai/ceoOrchestrator";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/ai-ceo-daily — decision engine + action executor (24h schedule in production).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runAiCeoDailyCycle();
  return Response.json({
    ok: true,
    runId: result.runId,
    actionCount: result.actions.length,
    executionOk: result.execution.filter((e) => e.ok).length,
    opsCritical: result.opsIssues.filter((o) => o.severity === "critical").length,
  });
}
