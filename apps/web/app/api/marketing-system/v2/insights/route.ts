import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { computeFunnelStepCounts } from "@/modules/marketing-intelligence/funnel-insights.service";
import { aggregateSubjectRoi } from "@/modules/marketing-intelligence/subject-insights.service";

export const dynamic = "force-dynamic";

/** Extended marketing intelligence — funnel + subject ROI (additive to roi-summary). */
export async function GET() {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ error: "Marketing intelligence is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [funnel, subjects] = await Promise.all([
    computeFunnelStepCounts(auth.userId, since),
    aggregateSubjectRoi(auth.userId, since),
  ]);

  return NextResponse.json({
    windowDays: 90,
    funnel,
    topPerformingSubjects: subjects.topPerforming,
    worstPerformingSubjects: subjects.worstPerforming,
  });
}
