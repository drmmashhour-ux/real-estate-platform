import { NextResponse } from "next/server";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import {
  recordGrowthAutonomyChecklistCompletionEvent,
  recordGrowthAutonomyPrefillTelemetryEvent,
} from "@/modules/growth/growth-autonomy-monitoring.service";

export const dynamic = "force-dynamic";

export type GrowthAutonomyTelemetryBody = {
  event: "prefill_navigate" | "prefill_copy" | "validation_checklist_complete";
};

/**
 * Non-blocking client validation metrics — never throws from counters.
 */
export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as GrowthAutonomyTelemetryBody | null;
    const ev = body?.event;
    if (ev === "prefill_navigate" || ev === "prefill_copy") {
      recordGrowthAutonomyPrefillTelemetryEvent();
    } else if (ev === "validation_checklist_complete") {
      recordGrowthAutonomyChecklistCompletionEvent();
    }
  } catch {
    /* ignore malformed body */
  }

  return NextResponse.json({ ok: true });
}
