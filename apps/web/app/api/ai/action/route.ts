import { NextRequest } from "next/server";
import { executeAction } from "@/lib/ai/action";
import { getRecommendedAction } from "@/lib/ai/decision";
import type { ActionType } from "@/lib/ai/action";

export const dynamic = "force-dynamic";

/** POST /api/ai/action – execute action on a queue item (approve, flag, block, escalate). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueItemId, action, autoMode } = body as {
      queueItemId?: string;
      action?: string;
      autoMode?: boolean;
    };
    if (!queueItemId || !action) {
      return Response.json(
        { error: "queueItemId and action required (action: approve | flag | block | escalate)" },
        { status: 400 }
      );
    }
    const allowed: ActionType[] = ["approve", "flag", "block", "escalate"];
    if (!allowed.includes(action as ActionType)) {
      return Response.json({ error: `action must be one of: ${allowed.join(", ")}` }, { status: 400 });
    }

    const performedBy = autoMode ? "ai" : "human";
    let riskScore: number | undefined;
    if (autoMode && action === "approve") {
      const decision = await getRecommendedAction(queueItemId);
      if (decision && (decision.riskScore >= 50 || decision.recommendedAction === "block" || decision.recommendedAction === "flag")) {
        return Response.json({
          ok: false,
          message: "Auto-approve skipped: risk too high. Escalate or review manually.",
        });
      }
      riskScore = decision?.riskScore;
    }

    const result = await executeAction(queueItemId, action as ActionType, {
      riskScore,
      performedBy,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false, message: "Action failed" }, { status: 500 });
  }
}
