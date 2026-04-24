import type { MemoryPlaybook, PlaybookAssignment, PlaybookBanditStat, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { playbookLog } from "../playbook-memory.logger";
import { runPlaybookBanditRollup } from "../jobs/playbook-bandit-rollup.job";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

export type PlaybookMemoryOverview = {
  totalPlaybooks: number;
  activePlaybooks: number;
  pausedPlaybooks: number;
  assignments7d: number;
  successRate7d: number | null;
  avgReward7d: number | null;
  exploreRate7d: number | null;
  blockedRecommendations7d: number | null;
};

export type ExperimentHealth = {
  status: "ok" | "degraded" | "unknown";
  issues: string[];
  rollup: Awaited<ReturnType<typeof runPlaybookBanditRollup>> | null;
  emergencyFreezes: number;
};

const emptyOverview: PlaybookMemoryOverview = {
  totalPlaybooks: 0,
  activePlaybooks: 0,
  pausedPlaybooks: 0,
  assignments7d: 0,
  successRate7d: null,
  avgReward7d: null,
  exploreRate7d: null,
  blockedRecommendations7d: null,
};

export const playbookMemoryDashboardService = {
  async getOverview(): Promise<PlaybookMemoryOverview> {
    try {
      const since7 = daysAgo(7);
      const [tot, act, pau, a7, assignOutcomes, explore, rewardRows] = await Promise.all([
        prisma.memoryPlaybook.count().catch(() => 0),
        prisma.memoryPlaybook.count({ where: { status: "ACTIVE" } }).catch(() => 0),
        prisma.memoryPlaybook.count({ where: { status: "PAUSED" } }).catch(() => 0),
        prisma.playbookAssignment.count({ where: { createdAt: { gte: since7 } } }).catch(() => 0),
        prisma.playbookAssignment
          .findMany({
            where: { createdAt: { gte: since7 }, outcomeStatus: { in: ["SUCCEEDED", "FAILED"] } },
            select: { outcomeStatus: true },
          })
          .catch(() => [] as { outcomeStatus: string }[]),
        prisma.playbookAssignment
          .findMany({
            where: { createdAt: { gte: since7 }, explorationRate: { not: null } },
            select: { explorationRate: true },
          })
          .catch(() => [] as { explorationRate: number | null }[]),
        prisma.playbookAssignment
          .findMany({
            where: { createdAt: { gte: since7 } },
            select: { realizedValue: true, realizedRevenue: true, realizedConversion: true },
          })
          .catch(
            () =>
              [] as {
                realizedValue: number | null;
                realizedRevenue: number | null;
                realizedConversion: number | null;
              }[],
          ),
      ]);

      const a7b = a7;
      const succF = assignOutcomes.filter((x) => x.outcomeStatus === "SUCCEEDED").length;
      const failF = assignOutcomes.filter((x) => x.outcomeStatus === "FAILED").length;
      const successRate7d = succF + failF > 0 ? succF / (succF + failF) : null;
      const exploreN = explore.filter((e) => e.explorationRate != null && Number.isFinite(e.explorationRate!));
      const exploreRate7d = exploreN.length
        ? exploreN.reduce((s, e) => s + (e.explorationRate ?? 0), 0) / exploreN.length
        : null;
      const rewardParts = rewardRows
        .map((r) => {
          const parts: number[] = [];
          if (r.realizedRevenue != null) parts.push(Math.min(1, Math.log1p(r.realizedRevenue) / 18));
          if (r.realizedValue != null) parts.push(Math.min(1, Math.log1p(Math.abs(r.realizedValue)) / 20));
          if (r.realizedConversion != null) {
            const c = r.realizedConversion > 1 ? r.realizedConversion / 100 : r.realizedConversion;
            parts.push(Math.min(1, c));
          }
          if (parts.length === 0) return null;
          return parts.reduce((a, b) => a + b, 0) / parts.length;
        })
        .filter((x): x is number => x != null);
      const avgReward7d = rewardParts.length ? rewardParts.reduce((a, b) => a + b, 0) / rewardParts.length : null;

      playbookLog.info("getOverview", { total: tot, active: act, paused: pau, a7: a7b });
      return {
        totalPlaybooks: tot,
        activePlaybooks: act,
        pausedPlaybooks: pau,
        assignments7d: a7b,
        successRate7d,
        avgReward7d,
        exploreRate7d,
        blockedRecommendations7d: null,
      };
    } catch (e) {
      playbookLog.error("getOverview", { message: e instanceof Error ? e.message : String(e) });
      return emptyOverview;
    }
  },

  async getPlaybookDetail(playbookId: string): Promise<{
    playbook: MemoryPlaybook & { versions: { id: string; version: number; isActive: boolean; createdAt: Date }[]; currentVersion: { id: string; version: number; isActive: boolean } | null };
    lifecycle: { id: string; createdAt: Date; eventType: string; reason: string | null; playbookVersionId: string | null }[];
    assignments: PlaybookAssignment[];
    bandit: PlaybookBanditStat[];
    memorySummaries: { id: string; createdAt: Date; outcomeStatus: string; actionType: string; domain: string }[];
  } | null> {
    try {
      const pb = await prisma.memoryPlaybook
        .findUnique({
          where: { id: playbookId },
          include: {
            versions: { orderBy: { version: "desc" }, take: 20, select: { id: true, version: true, isActive: true, createdAt: true } },
            currentVersion: { select: { id: true, version: true, isActive: true } },
          },
        })
        .catch(() => null);
      if (!pb) return null;
      const [lifecycle, assignments, bandit, memorySummaries] = await Promise.all([
        prisma.memoryPlaybookLifecycleEvent
          .findMany({ where: { playbookId }, orderBy: { createdAt: "desc" }, take: 30 })
          .catch(() => []),
        prisma.playbookAssignment.findMany({ where: { playbookId }, orderBy: { createdAt: "desc" }, take: 20 }).catch(() => []),
        prisma.playbookBanditStat
          .findMany({ where: { playbookId }, orderBy: { updatedAt: "desc" }, take: 40 })
          .catch(() => []),
        prisma.playbookMemoryRecord
          .findMany({
            where: { memoryPlaybookId: playbookId },
            orderBy: { createdAt: "desc" },
            take: 30,
            select: { id: true, createdAt: true, outcomeStatus: true, actionType: true, domain: true },
          })
          .catch(() => []),
      ]);
      return { playbook: pb, lifecycle, assignments, bandit, memorySummaries };
    } catch (e) {
      playbookLog.error("getPlaybookDetail", { playbookId, message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  async getRecentAssignments(params?: { playbookId?: string; domain?: string; limit?: number }): Promise<PlaybookAssignment[]> {
    const take = Math.min(200, Math.max(1, params?.limit ?? 50));
    const where: Prisma.PlaybookAssignmentWhereInput = {};
    if (params?.playbookId) where.playbookId = params.playbookId;
    if (params?.domain) where.domain = params.domain as (typeof where.domain);
    try {
      return await prisma.playbookAssignment.findMany({ where, orderBy: { createdAt: "desc" }, take });
    } catch (e) {
      playbookLog.error("getRecentAssignments", { message: e instanceof Error ? e.message : String(e) });
      return [];
    }
  },

  async getBanditStatsView(params?: {
    playbookId?: string;
    domain?: string;
    segmentKey?: string;
    marketKey?: string;
    limit?: number;
  }): Promise<PlaybookBanditStat[]> {
    const take = Math.min(500, Math.max(1, params?.limit ?? 100));
    const where: Prisma.PlaybookBanditStatWhereInput = {};
    if (params?.playbookId) where.playbookId = params.playbookId;
    if (params?.domain) where.domain = params.domain as (typeof where.domain);
    if (params?.segmentKey != null) where.segmentKey = params.segmentKey;
    if (params?.marketKey != null) where.marketKey = params.marketKey;
    try {
      return await prisma.playbookBanditStat.findMany({ where, orderBy: { updatedAt: "desc" }, take });
    } catch (e) {
      playbookLog.error("getBanditStatsView", { message: e instanceof Error ? e.message : String(e) });
      return [];
    }
  },

  async getExperimentHealth(): Promise<ExperimentHealth> {
    try {
      const freezes = await prisma.playbookControlSetting
        .count({ where: { emergencyFreeze: true } })
        .catch(() => 0);
      const rollup = await runPlaybookBanditRollup({ maxRows: 300 });
      const issues: string[] = [];
      if (freezes > 0) {
        issues.push(`${freezes} emergency freeze(s) active in control settings.`);
      }
      if (rollup.banditRowCount === 0 && rollup.assignmentsScanned > 0) {
        issues.push("Assignments exist but bandit stats table is empty — learning may be delayed.");
      }
      const status = issues.length ? "degraded" : "ok";
      return {
        status: rollup.notes === "rollup_failed" ? "unknown" : status,
        issues: rollup.notes === "rollup_failed" ? ["Rollup could not read stats."] : issues,
        rollup,
        emergencyFreezes: freezes,
      };
    } catch (e) {
      playbookLog.error("getExperimentHealth", { message: e instanceof Error ? e.message : String(e) });
      return { status: "unknown", issues: [String(e)], rollup: null, emergencyFreezes: 0 };
    }
  },

  async getPlaybookSummaries(
    take = 150,
  ): Promise<{ id: string; name: string; key: string; status: string; domain: string; updatedAt: Date }[]> {
    try {
      return await prisma.memoryPlaybook.findMany({
        orderBy: { updatedAt: "desc" },
        take: Math.min(500, take),
        select: { id: true, name: true, key: true, status: true, domain: true, updatedAt: true },
      });
    } catch (e) {
      playbookLog.error("getPlaybookSummaries", { message: e instanceof Error ? e.message : String(e) });
      return [];
    }
  },
};
