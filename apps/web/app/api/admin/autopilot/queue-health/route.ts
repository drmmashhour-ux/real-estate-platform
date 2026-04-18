import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { getLastGuardrailSessionStats } from "@/modules/ai-autopilot/core/action-guardrail.service";

export const dynamic = "force-dynamic";

/**
 * Admin-only — queue health: dedupe counters, stale distribution, last guardrail session.
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }

  const [byStatus, dupSum, guardrails] = await Promise.all([
    prisma.platformAutopilotAction.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.platformAutopilotAction.aggregate({
      _sum: { duplicateCount: true },
    }),
    Promise.resolve(getLastGuardrailSessionStats()),
  ]);

  return NextResponse.json({
    ok: true,
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    totalDuplicateRefreshes: dupSum._sum.duplicateCount ?? 0,
    lastGuardrailSession: guardrails,
    note: "lastGuardrailSession resets each persistRankedRun invocation",
  });
}
