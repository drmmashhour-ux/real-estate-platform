import { prisma } from "@/lib/db";
import { DEFAULT_AUTONOMY_BY_DOMAIN, PLAYBOOK_GOVERNANCE_MAX_AVG_RISK } from "../constants/playbook-memory.constants";
import { playbookLog } from "../playbook-memory.logger";
import * as repo from "../repository/playbook-memory.repository";
import { evaluatePlaybookEligibility } from "../services/playbook-memory-policy-gate.service";
import {
  applyDemotionIfNeeded,
  evaluateDemotionEligibility,
  evaluatePromotionEligibility,
  promotePlaybookVersion,
} from "../services/playbook-memory-lifecycle.service";

const PB = "[playbook]";

export type PlaybookLifecycleGovernorReport = {
  playbookId: string;
  promotion: {
    eligibleAtPlaybookLevel: boolean;
    promotionReasons: string[];
    eligibleVersionIds: string[];
    autoPromoteBlockers: string[];
    autoPromoteAttempted: boolean;
  };
  demotion: {
    shouldDemote: boolean;
    demotionReasons: string[];
    demotionApplied: boolean;
  };
};

/**
 * Scans playbooks, evaluates promotion/demotion deterministically, optionally applies demotion and (rarely) auto-promotion.
 * Safe default: `applyDemotion` and `autoPromote` are false — only returns a report (no writes).
 */
export async function runPlaybookLifecycleGovernor(options?: {
  maxPlaybooks?: number;
  /** When true, pauses playbooks that pass demotion thresholds. Default false (report-only). */
  applyDemotion?: boolean;
  /** When true with strict preconditions: single eligible version, ACTIVE, no current version, policy gate passes. Default false. */
  autoPromote?: boolean;
}): Promise<{
  scanned: number;
  promoted: number;
  demoted: number;
  paused: number;
  reports: PlaybookLifecycleGovernorReport[];
}> {
  const max = options?.maxPlaybooks ?? 100;
  const applyDemotion = options?.applyDemotion ?? false;
  const autoPromote = options?.autoPromote ?? false;

  const rows = await prisma.memoryPlaybook.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
    orderBy: { updatedAt: "desc" },
    take: max,
    select: { id: true },
  });

  let promoted = 0;
  let demoted = 0;
  const reports: PlaybookLifecycleGovernorReport[] = [];

  for (const row of rows) {
    const playbookId = row.id;
    const report: PlaybookLifecycleGovernorReport = {
      playbookId,
      promotion: {
        eligibleAtPlaybookLevel: false,
        promotionReasons: [],
        eligibleVersionIds: [],
        autoPromoteBlockers: [],
        autoPromoteAttempted: false,
      },
      demotion: {
        shouldDemote: false,
        demotionReasons: [],
        demotionApplied: false,
      },
    };

    try {
      const pb = await repo.getMemoryPlaybookById(playbookId);
      if (!pb) {
        reports.push(report);
        continue;
      }

      const prom = await evaluatePromotionEligibility({ playbookId });
      report.promotion.eligibleAtPlaybookLevel = prom.eligible;
      report.promotion.promotionReasons = prom.reasons;

      const unarchived = pb.versions.filter((v) => v.archivedAt == null);
      for (const v of unarchived) {
        const ev = await evaluatePromotionEligibility({ playbookId, playbookVersionId: v.id });
        if (ev.eligible) report.promotion.eligibleVersionIds.push(v.id);
      }

      const dem = await evaluateDemotionEligibility({ playbookId });
      report.demotion.shouldDemote = dem.shouldDemote;
      report.demotion.demotionReasons = dem.reasons;

      if (applyDemotion && dem.shouldDemote) {
        const r = await applyDemotionIfNeeded({ playbookId, reason: "governor" });
        if (r.ok && r.data.demoted) {
          demoted += 1;
          report.demotion.demotionApplied = true;
        }
      }

      if (autoPromote) {
        const blockers: string[] = [];
        if (pb.status !== "ACTIVE") blockers.push("playbook_not_active");
        if (pb.currentVersionId) blockers.push("active_version_already_set");
        if (report.promotion.eligibleVersionIds.length !== 1) {
          if (report.promotion.eligibleVersionIds.length === 0) blockers.push("no_eligible_version");
          else blockers.push("multiple_eligible_versions");
        }

        const domainDefault = DEFAULT_AUTONOMY_BY_DOMAIN[pb.domain] ?? "HUMAN_APPROVAL";
        const gate = evaluatePlaybookEligibility({
          status: pb.status,
          executionMode: pb.executionMode,
          scoreBand: pb.scoreBand,
          avgRiskScore: pb.avgRiskScore,
          policyFlags: {},
          autonomyMode: domainDefault,
          domain: pb.domain,
        });
        if (!gate.allowed) {
          blockers.push(...gate.blockedReasons);
        }
        if (pb.avgRiskScore != null && Number.isFinite(pb.avgRiskScore) && pb.avgRiskScore > PLAYBOOK_GOVERNANCE_MAX_AVG_RISK) {
          blockers.push("avg_risk_exceeds_governance_max");
        }

        const lastPaused = await prisma.memoryPlaybookLifecycleEvent.findFirst({
          where: { playbookId, eventType: "PAUSED" },
          orderBy: { createdAt: "desc" },
        });
        const reason = (lastPaused?.reason ?? "").toLowerCase();
        if (reason.includes("manual") || reason.includes("operator")) {
          blockers.push("manual_pause_governance");
        }

        report.promotion.autoPromoteBlockers = blockers;
        report.promotion.autoPromoteAttempted = true;

        if (blockers.length === 0) {
          const onlyId = report.promotion.eligibleVersionIds[0]!;
          const res = await promotePlaybookVersion({
            playbookId,
            playbookVersionId: onlyId,
            reason: "governor_auto_promote",
          });
          if (res.ok) {
            promoted += 1;
          } else {
            report.promotion.autoPromoteBlockers = [...blockers, res.error];
          }
        }
      }
    } catch (e) {
      playbookLog.error("lifecycle governor row", {
        playbookId,
        message: e instanceof Error ? e.message : String(e),
      });
    }

    reports.push(report);
  }

  const paused = demoted;
  // eslint-disable-next-line no-console
  console.log(PB, "lifecycle governor", { scanned: rows.length, promoted, demoted, paused });
  playbookLog.info("runPlaybookLifecycleGovernor", { scanned: rows.length, promoted, demoted, paused });
  return { scanned: rows.length, promoted, demoted, paused, reports };
}
