import type { MemoryDomain, PlaybookExecutionMode } from "@prisma/client";
import { getDomainModule } from "@/modules/playbook-domains/shared/domain-registry";
import {
  DISALLOW_AUTOPILOT_ACTION_TYPES,
  HIGH_RISK_MEMORY_DOMAINS,
} from "../constants/playbook-memory.constants";
import { prisma } from "@/lib/db";
import { playbookLog } from "../playbook-memory.logger";
import { versionKey, playbookMemoryBanditService } from "./playbook-memory-bandit.service";
import { playbookMemoryWriteService } from "./playbook-memory-write.service";
import type { PlaybookComparableContext, PlaybookExecutionPlan, PlaybookExecutionResult } from "../types/playbook-memory.types";

const FINANCIAL_OR_LEGAL_ACTION = /^(pay|payout|invoice|contract|legal|sign|wire|transfer|settlement|lawsuit)/i;
const MESSAGING_ACTION = /(message|sms|whatsapp|email|notify_user|outbound)/i;

function resolveComparableContext(plan: PlaybookExecutionPlan): PlaybookComparableContext {
  const p = plan.payload;
  if (p.memoryContext && typeof p.memoryContext === "object" && p.memoryContext !== null && "domain" in p.memoryContext) {
    return p.memoryContext as PlaybookComparableContext;
  }
  if (p.context && typeof p.context === "object" && p.context !== null && "domain" in (p.context as object)) {
    return p.context as PlaybookComparableContext;
  }
  if (p.domain && typeof p.entityType === "string") {
    return { domain: p.domain as MemoryDomain, entityType: p.entityType };
  }
  return { domain: "GROWTH", entityType: "playbook_execution" };
}

/**
 * Enforce Wave 8 rules: no external messaging, no financial/legal side effects, no MESSAGING/RISK autopilot write.
 */
function evaluateSafeAutopilotAllowance(
  plan: PlaybookExecutionPlan,
): { ok: true } | { ok: false; reason: string; explanation: string } {
  const at = (plan.actionType ?? "").trim();
  if (!at) {
    return { ok: false, reason: "missing_action_type", explanation: "No action type is set; nothing can be run." };
  }
  if (DISALLOW_AUTOPILOT_ACTION_TYPES.has(at)) {
    return {
      ok: false,
      reason: "disallowed_messaging_action",
      explanation: "This action is blocked because it can trigger outbound user messaging.",
    };
  }
  if (MESSAGING_ACTION.test(at)) {
    return {
      ok: false,
      reason: "messaging_action_blocked",
      explanation: "This action name implies external messaging, which is not allowed from automation.",
    };
  }
  if (FINANCIAL_OR_LEGAL_ACTION.test(at)) {
    return {
      ok: false,
      reason: "financial_or_legal_action_blocked",
      explanation: "Financial and legal action types are not allowed from the controlled execution layer.",
    };
  }
  const ctx = resolveComparableContext(plan);
  if (HIGH_RISK_MEMORY_DOMAINS.has(ctx.domain) || ctx.domain === "MESSAGING") {
    return {
      ok: false,
      reason: "domain_blocked_for_automation",
      explanation: "This memory domain is restricted; automated execution is not allowed.",
    };
  }
  return { ok: true };
}

/**
 * Additive: domain module may further restrict which SAFE_AUTOPILOT actions are allowed. Never throws.
 */
function evaluateDomainModuleExecution(
  plan: PlaybookExecutionPlan,
): { ok: true } | { ok: false; reason: string; explanation: string } {
  try {
    const ctx = resolveComparableContext(plan);
    const mod = getDomainModule(String(ctx.domain));
    if (!mod) {
      return { ok: true };
    }
    const at = (plan.actionType ?? "").trim();
    if (!at) {
      return { ok: true };
    }
    if (!mod.getExecutionAdapter().canExecute(at)) {
      return {
        ok: false,
        reason: "domain_module_action_blocked",
        explanation: "This action type is not allowed for the selected memory domain (domain module).",
      };
    }
    const safety = mod.getSafetyRules();
    const al = at.toLowerCase();
    for (const b of safety.blockedActionTypes) {
      if (al === b.toLowerCase()) {
        return {
          ok: false,
          reason: "domain_safety_blocked_action",
          explanation: "The domain policy disallows this action type.",
        };
      }
    }
    if (safety.maxRiskScore != null) {
      const p = plan.payload;
      const risk = (p as { riskScore?: number; safetyScore?: number; memoryContext?: { riskScore?: number; safetyScore?: number } });
      const v =
        risk.riskScore ??
        risk.safetyScore ??
        risk.memoryContext?.riskScore ??
        risk.memoryContext?.safetyScore;
      if (v != null && Number.isFinite(v) && v > safety.maxRiskScore) {
        return {
          ok: false,
          reason: "domain_max_risk_exceeded",
          explanation: "The action exceeds the risk ceiling for this memory domain module.",
        };
      }
    }
    return { ok: true };
  } catch (e) {
    playbookLog.warn("evaluateDomainModuleExecution", {
      message: e instanceof Error ? e.message : String(e),
    });
    return { ok: true };
  }
}

function result(
  params: {
    success: boolean;
    executed: boolean;
    mode: PlaybookExecutionMode;
    reason?: string;
    explanation?: string;
  },
): PlaybookExecutionResult {
  return {
    success: params.success,
    executed: params.executed,
    mode: params.mode,
    reason: params.reason,
    explanation: params.explanation,
  };
}

export const playbookMemoryExecutionService = {
  async execute(plan: PlaybookExecutionPlan): Promise<PlaybookExecutionResult> {
    const mode = plan.executionMode;
    try {
      if (!plan.playbookId) {
        playbookLog.info("playbook_execute", { stage: "invalid_plan", reason: "missing_playbook_id" });
        return result({
          success: false,
          executed: false,
          mode,
          reason: "invalid_plan",
          explanation: "The execution plan is missing a playbook id.",
        });
      }

      if (!plan.actionType) {
        playbookLog.info("playbook_execute", { stage: "blocked", reason: "missing_action_type", playbookId: plan.playbookId });
        return result({
          success: false,
          executed: false,
          mode,
          reason: "missing_action_type",
          explanation: "Execution is blocked: action type is missing, so the plan is incomplete.",
        });
      }

      if (mode === "RECOMMEND_ONLY") {
        playbookLog.info("playbook_execute", { stage: "recommend_only", playbookId: plan.playbookId, actionType: plan.actionType });
        return result({
          success: true,
          executed: false,
          mode,
          reason: "recommendation_only",
          explanation: "This playbook is in recommendation-only mode; no side effects are performed.",
        });
      }

      if (mode === "HUMAN_APPROVAL") {
        playbookLog.info("playbook_execute", { stage: "human_approval_pending", playbookId: plan.playbookId, actionType: plan.actionType });
        return result({
          success: true,
          executed: false,
          mode,
          reason: "awaiting_human_approval",
          explanation: "Human approval is required before any automated step may run; nothing was executed.",
        });
      }

      if (mode === "SAFE_AUTOPILOT") {
        const check = evaluateSafeAutopilotAllowance(plan);
        if (!check.ok) {
          playbookLog.info("execute blocked (safe)", { reason: check.reason, actionType: plan.actionType });
          return result({
            success: false,
            executed: false,
            mode,
            reason: check.reason,
            explanation: check.explanation,
          });
        }

        const dgate = evaluateDomainModuleExecution(plan);
        if (!dgate.ok) {
          playbookLog.info("execute blocked (domain module)", { reason: dgate.reason, actionType: plan.actionType });
          return result({
            success: false,
            executed: false,
            mode,
            reason: dgate.reason,
            explanation: dgate.explanation,
          });
        }

        const dmod = getDomainModule(String(resolveComparableContext(plan).domain));
        if (dmod && plan.actionType) {
          dmod
            .getExecutionAdapter()
            .execute(plan.actionType, plan.payload)
            .catch((e) => {
              playbookLog.error("domain_adapter_execute", { message: e instanceof Error ? e.message : String(e) });
            });
        }

        const ctx = resolveComparableContext(plan);
        playbookLog.info("safe_autopilot_log_only", { actionType: plan.actionType, domain: ctx.domain });

        const row = await playbookMemoryWriteService.recordDecision({
          source: "AI_AUTOMATION",
          triggerEvent: "playbook_execution",
          actionType: plan.actionType,
          context: ctx,
          actionPayload: {
            executionMode: "SAFE_AUTOPILOT" as const,
            playbookId: plan.playbookId,
            playbookVersionId: plan.playbookVersionId,
            ...plan.payload,
          },
          initialConfidence: 0.7,
          playbookId: plan.playbookId,
          playbookVersionId: plan.playbookVersionId ?? undefined,
        });

        if (!row) {
          return result({
            success: false,
            executed: false,
            mode,
            reason: "memory_write_failed",
            explanation: "The run was not persisted because the memory log write did not complete.",
          });
        }

        const aid = plan.payload.assignmentId;
        if (typeof aid === "string" && aid.length > 0) {
          try {
            const n = await prisma.playbookAssignment.updateMany({
              where: { id: aid },
              data: { executed: true, memoryRecordId: row.id },
            });
            if (n.count > 0) {
              const a = await prisma.playbookAssignment.findUnique({ where: { id: aid } });
              if (a) {
                await playbookMemoryBanditService.incrementExecutionsOnly({
                  domain: a.domain,
                  segmentKey: a.segmentKey || "",
                  marketKey: a.marketKey || "",
                  playbookId: a.playbookId,
                  playbookVersionId: versionKey(a.playbookVersionId) || a.playbookVersionKey,
                });
              }
              playbookLog.info("playbook_execute", { stage: "assignment_linked", assignmentId: aid, memoryRecordId: row.id });
            }
          } catch (e) {
            playbookLog.error("playbook_execute_assignment_link", { message: e instanceof Error ? e.message : String(e) });
          }
        }

        return result({
          success: true,
          executed: true,
          mode,
          explanation:
            "Safe autopilot: execution was limited to an internal memory log; no user messaging, payments, or legal steps were run.",
        });
      }

      playbookLog.info("playbook_execute", { stage: "full_autopilot_blocked", playbookId: plan.playbookId, actionType: plan.actionType });
      return result({
        success: false,
        executed: false,
        mode,
        reason: "full_autopilot_blocked",
        explanation: "Full autopilot is not enabled; execution is always blocked in this build.",
      });
    } catch (e) {
      playbookLog.error("playbookMemoryExecutionService.execute", {
        message: e instanceof Error ? e.message : String(e),
        mode: plan.executionMode,
      });
      return result({
        success: false,
        executed: false,
        mode: plan.executionMode,
        reason: "execution_error",
        explanation: "The execution request failed in a non-recoverable way; nothing was executed.",
      });
    }
  },
};
