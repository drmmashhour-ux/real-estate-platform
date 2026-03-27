import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildOverfittingAssessmentFromRuns,
  resolveValidationTripletForOverfitting,
} from "@/modules/model-validation/infrastructure/overfittingCheckService";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

/**
 * Overfitting risk: same-set gains vs fresh-set behavior (admin only). Does not apply tuning.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;
  const url = new URL(request.url);
  const qBaseline = url.searchParams.get("baselineRunId");
  const qSame = url.searchParams.get("tunedSameRunId");
  const qFresh = url.searchParams.get("tunedFreshRunId");

  let baselineRunId = qBaseline ?? undefined;
  let tunedSameRunId = qSame ?? undefined;
  let tunedFreshRunId = qFresh ?? undefined;

  if (!baselineRunId || !tunedSameRunId || !tunedFreshRunId) {
    const inferred = await resolveValidationTripletForOverfitting(prisma, id);
    if (!("error" in inferred)) {
      baselineRunId = baselineRunId ?? inferred.baselineRunId;
      tunedSameRunId = tunedSameRunId ?? inferred.tunedSameRunId ?? undefined;
      tunedFreshRunId = tunedFreshRunId ?? inferred.tunedFreshRunId ?? undefined;
    }
  }

  if (!baselineRunId || !tunedSameRunId || !tunedFreshRunId) {
    return NextResponse.json(
      {
        error:
          "Provide baselineRunId, tunedSameRunId, and tunedFreshRunId (query params), or open this endpoint from a tuned_same_set / tuned_fresh_set run id.",
        missing: {
          baselineRunId: !baselineRunId,
          tunedSameRunId: !tunedSameRunId,
          tunedFreshRunId: !tunedFreshRunId,
        },
      },
      { status: 400 },
    );
  }

  const assessment = await buildOverfittingAssessmentFromRuns(prisma, {
    baselineRunId,
    tunedSameRunId,
    tunedFreshRunId,
  });

  if ("error" in assessment) {
    return NextResponse.json({ error: assessment.error }, { status: 400 });
  }

  return NextResponse.json({
    baselineRunId,
    tunedSameRunId,
    tunedFreshRunId,
    overfittingRisk: assessment.overfittingRisk,
    reasons: assessment.reasons,
  });
}
