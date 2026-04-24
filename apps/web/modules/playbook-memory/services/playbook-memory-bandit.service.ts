import type { MemoryDomain, MemoryOutcomeStatus, PlaybookAssignmentSelectionMode, PlaybookBanditStat } from "@prisma/client";
import { prisma } from "@/lib/db";
import { banditLog } from "../playbook-learning-logger";
import { playbookLog } from "../playbook-memory.logger";
import { resolveRewardForDomain } from "../utils/playbook-memory-bandit";
import { stableStringify, sha256Hex } from "../utils/playbook-memory-fingerprint";

export type BanditKey = {
  domain: MemoryDomain;
  segmentKey: string;
  marketKey: string;
  playbookId: string;
  playbookVersionId: string;
};

function versionKey(v: string | null | undefined): string {
  if (v == null || v === "none" || v === "") return "";
  return v;
}

function banditKeyHash(k: BanditKey): string {
  return sha256Hex(
    stableStringify({
      d: k.domain,
      s: k.segmentKey,
      m: k.marketKey,
      p: k.playbookId,
      v: k.playbookVersionId,
    }),
  );
}

function keyFromRow(r: PlaybookBanditStat): BanditKey {
  return {
    domain: r.domain,
    segmentKey: r.segmentKey,
    marketKey: r.marketKey,
    playbookId: r.playbookId,
    playbookVersionId: r.playbookVersionId,
  };
}

export const playbookMemoryBanditService = {
  async getBanditStats(params: { keys: BanditKey[] }): Promise<Map<string, PlaybookBanditStat | null>> {
    const m = new Map<string, PlaybookBanditStat | null>();
    if (params.keys.length === 0) return m;
    for (const k of params.keys) {
      m.set(banditKeyHash({ ...k, playbookVersionId: versionKey(k.playbookVersionId) }), null);
    }
    try {
      const or = params.keys.map((k) => ({
        domain: k.domain,
        playbookId: k.playbookId,
        playbookVersionId: versionKey(k.playbookVersionId),
        segmentKey: k.segmentKey || "",
        marketKey: k.marketKey || "",
      }));
      const rows = await prisma.playbookBanditStat.findMany({ where: { OR: or } });
      for (const r of rows) {
        m.set(banditKeyHash(keyFromRow(r)), r);
      }
    } catch (e) {
      playbookLog.error("getBanditStats", { message: e instanceof Error ? e.message : String(e) });
    }
    return m;
  },

  async upsertSelectionImpression(params: BanditKey & { alsoExecute?: boolean }): Promise<void> {
    const v = versionKey(params.playbookVersionId);
    const sk = params.segmentKey || "";
    const mk = params.marketKey || "";
    try {
      const row = await prisma.playbookBanditStat.upsert({
        where: {
          domain_playbookId_playbookVersionId_segmentKey_marketKey: {
            domain: params.domain,
            playbookId: params.playbookId,
            playbookVersionId: v,
            segmentKey: sk,
            marketKey: mk,
          },
        },
        create: {
          domain: params.domain,
          playbookId: params.playbookId,
          playbookVersionId: v,
          segmentKey: sk,
          marketKey: mk,
          impressions: 1,
          executions: params.alsoExecute ? 1 : 0,
          successes: 0,
          failures: 0,
          lastSelectedAt: new Date(),
        },
        update: {
          impressions: { increment: 1 },
          lastSelectedAt: new Date(),
          ...(params.alsoExecute ? { executions: { increment: 1 } } : {}),
        },
      });
      void row;
      playbookLog.info("bandit_impression", { domain: params.domain, playbookId: params.playbookId });
    } catch (e) {
      playbookLog.error("upsertSelectionImpression", { message: e instanceof Error ? e.message : String(e) });
    }
  },

  /**
   * Count a completed execution in bandit stats (independent of selection impressions). Never throws.
   */
  async incrementExecutionsOnly(params: BanditKey): Promise<void> {
    const v = versionKey(params.playbookVersionId);
    const sk = params.segmentKey || "";
    const mk = params.marketKey || "";
    try {
      await prisma.playbookBanditStat
        .update({
          where: {
            domain_playbookId_playbookVersionId_segmentKey_marketKey: {
              domain: params.domain,
              playbookId: params.playbookId,
              playbookVersionId: v,
              segmentKey: sk,
              marketKey: mk,
            },
          },
          data: { executions: { increment: 1 } },
        })
        .catch(() => {
          // Row may be missing; ignore for v1.
        });
    } catch (e) {
      playbookLog.error("incrementExecutionsOnly", { message: e instanceof Error ? e.message : String(e) });
    }
  },

  async updateBanditOutcome(params: {
    domain: MemoryDomain;
    segmentKey: string;
    marketKey: string;
    playbookId: string;
    playbookVersionId: string;
    selectionMode: PlaybookAssignmentSelectionMode;
    outcomeStatus: MemoryOutcomeStatus;
    rewardHint?: { realizedValue?: number | null; realizedRevenue?: number | null; realizedConversion?: number | null; realizedRiskScore?: number | null };
  }): Promise<void> {
    const v = versionKey(params.playbookVersionId);
    const sk = params.segmentKey || "";
    const mk = params.marketKey || "";
    const reward = resolveRewardForDomain(String(params.domain), {
      realizedValue: params.rewardHint?.realizedValue,
      realizedRevenue: params.rewardHint?.realizedRevenue,
      realizedConversion: params.rewardHint?.realizedConversion,
      realizedRiskScore: params.rewardHint?.realizedRiskScore,
    });
    const success = params.outcomeStatus === "SUCCEEDED";
    const fail = params.outcomeStatus === "FAILED";

    try {
      const before = await prisma.playbookBanditStat.findFirst({
        where: {
          domain: params.domain,
          playbookId: params.playbookId,
          playbookVersionId: v,
          segmentKey: sk,
          marketKey: mk,
        },
      });

      const s = before?.successes ?? 0;
      const f = before?.failures ?? 0;
      const s2 = success ? s + 1 : s;
      const f2 = fail ? f + 1 : f;
      const prevN = s + f;

      const newAvgReward =
        prevN === 0
          ? reward
          : before?.avgReward == null
            ? reward
            : (before.avgReward * prevN + reward) / (prevN + 1);

      const nRev = params.rewardHint?.realizedRevenue;
      const newRev =
        nRev == null
          ? before?.avgRevenue
          : before?.avgRevenue == null
            ? nRev
            : (before.avgRevenue * prevN + nRev) / (prevN + 1);
      const nC = params.rewardHint?.realizedConversion;
      const newConv =
        nC == null
          ? before?.avgConversion
          : before?.avgConversion == null
            ? nC
            : (before.avgConversion * prevN + nC) / (prevN + 1);
      const nR = params.rewardHint?.realizedRiskScore;
      const newRisk =
        nR == null
          ? before?.avgRiskScore
          : before?.avgRiskScore == null
            ? nR
            : (before.avgRiskScore * prevN + nR) / (prevN + 1);

      await prisma.playbookBanditStat.upsert({
        where: {
          domain_playbookId_playbookVersionId_segmentKey_marketKey: {
            domain: params.domain,
            playbookId: params.playbookId,
            playbookVersionId: v,
            segmentKey: sk,
            marketKey: mk,
          },
        },
        create: {
          domain: params.domain,
          playbookId: params.playbookId,
          playbookVersionId: v,
          segmentKey: sk,
          marketKey: mk,
          impressions: 0,
          executions: 0,
          successes: s2,
          failures: f2,
          avgReward: newAvgReward,
          avgRevenue: newRev,
          avgConversion: newConv,
          avgRiskScore: newRisk,
          lastOutcomeAt: new Date(),
        },
        update: {
          successes: s2,
          failures: f2,
          avgReward: newAvgReward,
          avgRevenue: newRev,
          avgConversion: newConv,
          avgRiskScore: newRisk,
          lastOutcomeAt: new Date(),
        },
      });

      const payload = {
        domain: params.domain,
        playbookId: params.playbookId,
        mode: params.selectionMode,
        outcome: params.outcomeStatus,
        reward,
      };
      playbookLog.info("bandit_outcome", payload);
      banditLog.info("outcome", payload);
    } catch (e) {
      playbookLog.error("updateBanditOutcome", { message: e instanceof Error ? e.message : String(e) });
    }
  },
};

export { versionKey, banditKeyHash };
