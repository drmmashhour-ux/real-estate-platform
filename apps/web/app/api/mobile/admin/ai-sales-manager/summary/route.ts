import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import {
  buildSalesManagerSummary,
  buildTeamPerformanceSummary,
  buildTopImprovementOpportunities,
} from "@/modules/ai-sales-manager/ai-sales-manager.service";
import { listRecentAlerts } from "@/modules/ai-sales-manager/ai-sales-alerts.service";
import { listTeams } from "@/modules/team-training/team.service";

export const dynamic = "force-dynamic";

/** GET — lightweight manager rollup (server memory/local snapshot may be empty without sync). */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId") ?? "";

  try {
    const summary = buildSalesManagerSummary();
    const alerts = listRecentAlerts(25).map((a) => ({
      id: a.alertId,
      kind: a.kind,
      severity: a.severity,
      title: a.title,
      body: a.body,
      userId: a.userId,
      createdAtIso: a.createdAtIso,
    }));

    let team:
      | ReturnType<typeof buildTeamPerformanceSummary>
      | null
      | undefined;
    let opportunities: ReturnType<typeof buildTopImprovementOpportunities> = [];

    if (teamId) {
      team = buildTeamPerformanceSummary(teamId);
      opportunities = buildTopImprovementOpportunities(teamId).slice(0, 8);
    }

    return Response.json({
      generatedAtIso: summary.generatedAtIso,
      aggregate: summary.aggregate,
      totalUsers: summary.totalUsers,
      trendSummary: summary.trendSummary,
      topPerformers: summary.topPerformers.slice(0, 8),
      needsSupport: summary.needsSupport.slice(0, 8),
      coachingPriorities: summary.coachingOpportunities.slice(0, 12),
      commonObjections: summary.commonObjections.slice(0, 12),
      alerts,
      teams: listTeams().map((t) => ({ teamId: t.teamId, name: t.name })),
      teamRollup: team ?? null,
      improvementOpportunities: opportunities,
      disclaimer:
        "Coach-only analytics; forecasts are probabilistic. Server snapshot may be empty until CRM/sync backs profiles.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "ai_sales_manager_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
