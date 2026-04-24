import { prisma } from "@/lib/db";
import { playbookLog } from "../playbook-memory.logger";
import {
  pausePlaybook as lifecyclePausePlaybook,
  promotePlaybookVersion as lifecyclePromotePlaybookVersion,
  resumePlaybook as lifecycleResumePlaybook,
} from "./playbook-memory-lifecycle.service";

type SafeResult<T> = { ok: true; data: T } | { ok: false; error: string };

function withAuditReason(base: string | undefined, userId?: string, extra?: string): string {
  const p = [base, userId && `user:${userId}`, extra].filter(Boolean).join(" | ");
  return p.length > 2_000 ? p.slice(0, 1_999) + "…" : p;
}

export const playbookMemoryControlService = {
  async pausePlaybook(playbookId: string, reason?: string, userId?: string): Promise<SafeResult<{ status: "PAUSED" }>> {
    const r = await lifecyclePausePlaybook({ playbookId, reason: withAuditReason(reason, userId, "control_service") });
    if (r.ok) {
      playbookLog.info("control_pause", { playbookId, userId });
    } else {
      playbookLog.warn("control_pause_failed", { playbookId, error: r.error });
    }
    return r;
  },

  async resumePlaybook(playbookId: string, reason?: string, userId?: string): Promise<SafeResult<{ status: "ACTIVE" }>> {
    const r = await lifecycleResumePlaybook({ playbookId, reason: withAuditReason(reason, userId, "control_service") });
    if (r.ok) {
      playbookLog.info("control_resume", { playbookId, userId });
    } else {
      playbookLog.warn("control_resume_failed", { playbookId, error: r.error });
    }
    return r;
  },

  async promotePlaybookVersion(
    playbookId: string,
    playbookVersionId: string,
    reason?: string,
    userId?: string,
  ): Promise<SafeResult<{ versionId: string }>> {
    const r = await lifecyclePromotePlaybookVersion({
      playbookId,
      playbookVersionId,
      reason: withAuditReason(reason, userId, "control_service"),
    });
    if (r.ok) {
      playbookLog.info("control_promote", { playbookId, playbookVersionId, userId });
    } else {
      playbookLog.warn("control_promote_failed", { playbookId, error: r.error });
    }
    return r;
  },

  async setExplorationCap(params: {
    scopeType: string;
    scopeKey: string;
    cap: number;
    userId?: string;
    reason?: string;
  }): Promise<SafeResult<{ id: string }>> {
    try {
      const row = await prisma.playbookControlSetting.upsert({
        where: { scopeType_scopeKey: { scopeType: params.scopeType, scopeKey: params.scopeKey } },
        create: {
          scopeType: params.scopeType,
          scopeKey: params.scopeKey,
          explorationCap: params.cap,
          reason: withAuditReason(params.reason, params.userId, "set_exploration_cap"),
          updatedByUserId: params.userId ?? null,
        },
        update: {
          explorationCap: params.cap,
          reason: withAuditReason(params.reason, params.userId, "set_exploration_cap"),
          updatedByUserId: params.userId ?? null,
        },
      });
      playbookLog.info("control_exploration_cap", { scope: `${params.scopeType}/${params.scopeKey}`, cap: params.cap });
      return { ok: true, data: { id: row.id } };
    } catch (e) {
      const err = e instanceof Error ? e.message : "upsert_failed";
      playbookLog.error("setExplorationCap", { err });
      return { ok: false, error: err };
    }
  },

  async setDomainForceMode(params: {
    domainKey: string;
    forceMode: string;
    userId?: string;
    reason?: string;
  }): Promise<SafeResult<{ id: string }>> {
    try {
      const row = await prisma.playbookControlSetting.upsert({
        where: { scopeType_scopeKey: { scopeType: "domain", scopeKey: params.domainKey } },
        create: {
          scopeType: "domain",
          scopeKey: params.domainKey,
          forceMode: params.forceMode,
          reason: withAuditReason(params.reason, params.userId, "set_domain_force_mode"),
          updatedByUserId: params.userId ?? null,
        },
        update: {
          forceMode: params.forceMode,
          reason: withAuditReason(params.reason, params.userId, "set_domain_force_mode"),
          updatedByUserId: params.userId ?? null,
        },
      });
      playbookLog.info("control_force_mode", { domain: params.domainKey, forceMode: params.forceMode });
      return { ok: true, data: { id: row.id } };
    } catch (e) {
      const err = e instanceof Error ? e.message : "upsert_failed";
      return { ok: false, error: err };
    }
  },

  async setEmergencyFreeze(params: { freeze: boolean; userId?: string; reason?: string }): Promise<SafeResult<{ id: string }>> {
    try {
      const row = await prisma.playbookControlSetting.upsert({
        where: { scopeType_scopeKey: { scopeType: "global", scopeKey: "emergency" } },
        create: {
          scopeType: "global",
          scopeKey: "emergency",
          emergencyFreeze: params.freeze,
          reason: withAuditReason(params.reason, params.userId, "set_emergency_freeze"),
          updatedByUserId: params.userId ?? null,
        },
        update: {
          emergencyFreeze: params.freeze,
          reason: withAuditReason(params.reason, params.userId, "set_emergency_freeze"),
          updatedByUserId: params.userId ?? null,
        },
      });
      playbookLog.info("control_emergency_freeze", { freeze: params.freeze });
      return { ok: true, data: { id: row.id } };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "upsert_failed" };
    }
  },
};
