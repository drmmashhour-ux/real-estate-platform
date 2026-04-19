import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildExecutionAccountabilityInsights } from "@/modules/growth/execution-accountability-insights.service";
import {
  buildExecutionAccountabilitySummary,
  clearChecklistCompletion,
  listChecklistCompletions,
  recordChecklistCompletion,
  recordPitchScriptUsage,
} from "@/modules/growth/execution-accountability.service";
import type { ExecutionSurfaceType } from "@/modules/growth/execution-accountability.types";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.executionAccountabilityV1) {
    return NextResponse.json({ error: "Execution accountability disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const summary = buildExecutionAccountabilitySummary();
  const insights = buildExecutionAccountabilityInsights(summary);
  const recent = listChecklistCompletions().slice(0, 25);

  return NextResponse.json({
    summary,
    insights,
    recent,
    disclaimer:
      "In-memory internal tracking only — no messages, payments, or lead pipeline changes. Resets on cold start.",
  });
}

export async function POST(req: Request) {
  if (!engineFlags.executionAccountabilityV1) {
    return NextResponse.json({ error: "Execution accountability disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    action?: "record" | "clear" | "pitch_copy";
    surfaceType?: ExecutionSurfaceType;
    itemId?: string;
    completed?: boolean;
    dayNumber?: number;
    weekNumber?: number;
    pitchVariant?: "60_sec" | "5_min";
  };

  if (body.action === "pitch_copy") {
    if (body.pitchVariant !== "60_sec" && body.pitchVariant !== "5_min") {
      return NextResponse.json({ error: "pitchVariant required" }, { status: 400 });
    }
    const row = recordPitchScriptUsage({ variant: body.pitchVariant, userId: auth.userId });
    return NextResponse.json({ ok: true, id: row.id });
  }

  if (body.action !== "record" && body.action !== "clear") {
    return NextResponse.json({ error: "action must be record, clear, or pitch_copy" }, { status: 400 });
  }
  if (!body.itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }
  if (body.surfaceType === "pitch_script") {
    return NextResponse.json({ error: "use pitch_copy for pitch script" }, { status: 400 });
  }
  if (body.surfaceType !== "daily_routine" && body.surfaceType !== "city_domination_mtl") {
    return NextResponse.json({ error: "surfaceType invalid" }, { status: 400 });
  }

  const row =
    body.action === "clear"
      ? clearChecklistCompletion({
          surfaceType: body.surfaceType,
          itemId: body.itemId,
          userId: auth.userId,
        })
      : recordChecklistCompletion({
          surfaceType: body.surfaceType,
          itemId: body.itemId,
          userId: auth.userId,
          completed: body.completed !== false,
          dayNumber: body.dayNumber,
          weekNumber: body.weekNumber,
        });

  return NextResponse.json({ ok: true, id: row.id });
}
