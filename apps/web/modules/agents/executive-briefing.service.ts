import { prisma } from "@/lib/db";
import { buildPortfolioIntelligence } from "@/modules/portfolio/portfolio-intelligence.service";
import type { PlatformRole } from "@prisma/client";
import type { ExecutiveBriefingPayload } from "./executive.types";
import { executiveLog } from "./executive-log";

export async function buildExecutiveBriefing(userId: string, role: PlatformRole): Promise<ExecutiveBriefingPayload> {
  executiveLog.briefing("build_start", {});

  const bundle = await buildPortfolioIntelligence(userId, role);
  const tasks = await prisma.executiveTask.findMany({
    where: { ownerUserId: userId, status: { in: ["OPEN", "WAITING_APPROVAL", "IN_PROGRESS"] } },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  const execPolicy = await prisma.executivePolicy.findUnique({ where: { ownerId: userId } });

  const criticalTasks = tasks.filter((t) => t.priority === "CRITICAL").slice(0, 10);
  const approvals = tasks.filter((t) => t.status === "WAITING_APPROVAL").slice(0, 10);

  return {
    date: new Date().toISOString(),
    topCriticalItems: criticalTasks.map((t) => ({
      title: t.title,
      entityId: t.entityId,
      summary: t.summary.slice(0, 280),
    })),
    topApprovalsNeeded: approvals.map((t) => ({ taskId: t.id, title: t.title })),
    atRiskAssets: bundle.watchlist.slice(0, 12).map((w) => ({
      assetId: w.assetId,
      reason: w.reason,
    })),
    blockedDeals: [],
    financingAlerts: bundle.capitalAllocation.rationale.slice(0, 5),
    complianceAlerts: tasks
      .filter((t) => t.originatingAgent === "LEGAL_COMPLIANCE")
      .slice(0, 5)
      .map((t) => t.title),
    topOpportunities: bundle.commonThemes.slice(0, 8),
    executiveSummary:
      `${bundle.overview.totalAssets} assets · critical ${bundle.overview.criticalCount} · approvals pending ${approvals.length}.`,
    policyMode: execPolicy?.autonomyMode ?? "SAFE_APPROVAL",
  };
}
