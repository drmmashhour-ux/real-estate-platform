import { NextResponse } from "next/server";
import { evaluateAndPersistActions } from "@/modules/senior-living/autonomy/senior-autonomous.service";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";

export const dynamic = "force-dynamic";

/** Runs marketplace evaluation → creates action logs (+ SAFE autopilot executions for LOW-risk). */
export async function POST() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;

  try {
    const out = await evaluateAndPersistActions();
    return NextResponse.json({
      ok: true,
      mode: out.settings.mode,
      paused: out.settings.paused,
      proposalsCount: out.proposals.length,
      executedIds: out.executedIds,
      proposals: out.proposals.map((p) => ({
        actionType: p.actionType,
        riskLevel: p.riskLevel,
        confidence: p.confidence,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "evaluate_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
