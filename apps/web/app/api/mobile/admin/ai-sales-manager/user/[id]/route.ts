import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildSalespersonDetailPayload } from "@/modules/ai-sales-manager/ai-sales-manager.service";

export const dynamic = "force-dynamic";

/** GET `/api/mobile/admin/ai-sales-manager/user/[id]` — compact salesperson coaching card. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const userId = decodeURIComponent(id);

  try {
    const detail = buildSalespersonDetailPayload(userId);
    return Response.json({
      userId: detail.profile.userId,
      displayName: detail.profile.displayName ?? null,
      overallScore: detail.scores.overall,
      scoreConfidence: detail.scores.confidence,
      factors: detail.scores.factors.map((f) => ({
        label: f.label,
        contribution: f.contribution,
        explanation: f.explanation,
      })),
      strengths: detail.coaching.strengths.slice(0, 5),
      weaknesses: detail.coaching.weaknesses.slice(0, 5),
      priorityAreas: detail.coaching.trainingPriorityAreas.slice(0, 5),
      recommendations: detail.recommendations.slice(0, 5).map((r) => ({
        title: r.title,
        reason: r.reason,
        urgency: r.urgency,
        scenarioIds: r.suggestedScenarioIds,
      })),
      strategies: detail.strategies.slice(0, 4).map((s) => ({
        title: s.title,
        exampleLine: s.exampleLine,
      })),
      forecast: {
        currentDemoRate: detail.forecast.current.demoBookingRate,
        currentCloseRate: detail.forecast.current.closeRate,
        confidence: detail.forecast.current.confidence,
        narrative: detail.forecast.current.narrative,
        risks: detail.forecast.current.riskFactors,
        ifCoachingFollowed: detail.forecast.ifCoachingFollowed.narrative,
      },
      alerts: detail.alerts.map((a) => ({
        title: a.title,
        body: a.body,
        kind: a.kind,
        severity: a.severity,
      })),
      managerNotesPreview: detail.profile.managerNotes.slice(0, 280),
      disclaimer: "Humans approve coaching actions; no auto-calling.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "user_payload_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
