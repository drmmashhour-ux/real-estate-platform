import { prisma } from "@/lib/db";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import { storedScopeMatchesSession } from "../founder-intelligence/founder-scope";
import type { ExecutiveAnalyticsSnapshot } from "./executive-analytics.types";
import { avgHoursToReviewBriefing } from "./briefing-effectiveness.service";

export async function buildExecutiveAnalytics(
  scope: ExecutiveScope,
  userId: string,
): Promise<ExecutiveAnalyticsSnapshot> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [briefings, actions, insightsRows] = await Promise.all([
    prisma.executiveBriefing.findMany({
      where: { createdByUserId: userId, createdAt: { gte: since } },
      select: { id: true, scopeKind: true, scopeOfficeIdsJson: true, generatedSummary: true },
    }),
    prisma.founderAction.findMany({
      where: { createdByUserId: userId },
      select: { status: true, scopeKind: true, scopeOfficeIdsJson: true, priority: true },
    }),
    prisma.executiveBriefing.findMany({
      where: { createdByUserId: userId },
      take: 15,
      orderBy: { createdAt: "desc" },
      select: { generatedSummary: true, scopeKind: true, scopeOfficeIdsJson: true },
    }),
  ]);

  const scopedBriefings = briefings.filter((b) => storedScopeMatchesSession(scope, b.scopeKind, b.scopeOfficeIdsJson));
  const scopedActions = actions.filter((a) => storedScopeMatchesSession(scope, a.scopeKind, a.scopeOfficeIdsJson));

  const completed = scopedActions.filter((a) => a.status === "completed" || a.status === "accepted").length;
  const total = scopedActions.length;
  const founderActionCompletionRate = total > 0 ? completed / total : null;

  let insightsGeneratedApprox = 0;
  for (const row of insightsRows) {
    if (!storedScopeMatchesSession(scope, row.scopeKind, row.scopeOfficeIdsJson)) continue;
    const g = row.generatedSummary as { payload?: { risks?: { facts?: unknown[] } } } | null;
    insightsGeneratedApprox += g?.payload?.risks?.facts?.length ?? 0;
  }

  const highUrgencyPrioritiesApprox = scopedActions.filter((a) => a.priority === "high").length;

  const bottleneckHints: string[] = [];
  for (const row of insightsRows.slice(0, 5)) {
    if (!storedScopeMatchesSession(scope, row.scopeKind, row.scopeOfficeIdsJson)) continue;
    bottleneckHints.push("bottleneck_section_present");
  }

  await avgHoursToReviewBriefing(userId);

  return {
    generatedAt: new Date().toISOString(),
    insightsGeneratedApprox,
    highUrgencyPrioritiesApprox,
    founderActionCompletionRate,
    repeatedBottleneckHints: bottleneckHints,
    briefingGenerationCount30d: scopedBriefings.length,
    topRiskCategories: [],
    topOpportunityCategories: [],
  };
}
