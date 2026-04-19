import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

type Action = "view" | "copy" | "ack" | "ignore";

function eventNameForAction(action: Action) {
  if (action === "view") return GrowthEventName.GROWTH_EXECUTION_AI_VIEW;
  if (action === "copy") return GrowthEventName.GROWTH_EXECUTION_AI_COPY;
  if (action === "ack") return GrowthEventName.GROWTH_EXECUTION_AI_ACK;
  return GrowthEventName.GROWTH_EXECUTION_AI_IGNORE;
}

/** POST — append-only Growth Machine telemetry for AI execution panel (measurement only). */
export async function POST(req: Request) {
  if (!engineFlags.growthExecutionResultsV1) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const suggestionId =
    typeof body === "object" && body && "suggestionId" in body
      ? String((body as { suggestionId?: unknown }).suggestionId ?? "").trim().slice(0, 160)
      : "";
  const actionRaw =
    typeof body === "object" && body && "action" in body
      ? String((body as { action?: unknown }).action ?? "").trim()
      : "";

  if (!suggestionId || !["view", "copy", "ack", "ignore"].includes(actionRaw)) {
    return NextResponse.json({ ok: false, error: "suggestionId and valid action required" }, { status: 400 });
  }

  const action = actionRaw as Action;
  const eventName = eventNameForAction(action);

  const dayKey = new Date().toISOString().slice(0, 10);
  const idempotencyKey =
    action === "view"
      ? `growth_exec_ai_view:${auth.userId}:${suggestionId}:${dayKey}`.slice(0, 160)
      : `growth_exec_ai:${action}:${auth.userId}:${suggestionId}:${Date.now()}`.slice(0, 160);

  await recordGrowthEvent({
    eventName,
    userId: auth.userId,
    idempotencyKey,
    metadata: asInputJsonValue({
      growthExecution: { suggestionId, action },
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
