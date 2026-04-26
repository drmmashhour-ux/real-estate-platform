import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { compareValidationRuns } from "@/modules/model-validation/application/compareValidationRuns";
import { findComparisonsInvolvingRun } from "@/modules/model-validation/infrastructure/validationRepository";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

/**
 * Stored comparisons for this run, plus optional on-demand recompute vs `baseRunId` query param.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;
  const url = new URL(request.url);
  const baseRunId = url.searchParams.get("baseRunId");
  const recompute = url.searchParams.get("recompute") === "1";

  const stored = await findComparisonsInvolvingRun(prisma, id);

  let live: Awaited<ReturnType<typeof compareValidationRuns>> | null = null;
  if (recompute && baseRunId) {
    try {
      live = await compareValidationRuns(prisma, baseRunId, id);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Compare failed" },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({
    runId: id,
    stored: stored.map((c) => ({
      id: c.id,
      baseRunId: c.baseRunId,
      comparisonRunId: c.comparisonRunId,
      metricsDelta: c.metricsDelta,
      summary: c.summary,
      createdAt: c.createdAt.toISOString(),
      baseRun: c.baseRun,
      comparisonRun: c.comparisonRun,
    })),
    recomputed: live,
  });
}
