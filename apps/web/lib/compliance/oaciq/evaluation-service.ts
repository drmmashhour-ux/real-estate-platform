import { evaluateOaciqRuleEngine } from "@/lib/compliance/oaciq/evaluate-rules";
import type {
  OaciqAiBehaviorBundle,
  OaciqComplianceRiskLevel,
  OaciqRuleEngineBundle,
} from "@/lib/compliance/oaciq/rule-engine.types";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

function asRuleEngine(raw: unknown): OaciqRuleEngineBundle {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("OACIQ_RULE_ENGINE_INVALID");
  }
  const o = raw as Record<string, unknown>;
  const req = o.requiredActions;
  const forb = o.forbiddenActions;
  const cond = o.conditionalChecks;
  if (!Array.isArray(req) || !req.every((x) => typeof x === "string")) {
    throw new Error("OACIQ_RULE_ENGINE_INVALID");
  }
  if (!Array.isArray(forb) || !forb.every((x) => typeof x === "string")) {
    throw new Error("OACIQ_RULE_ENGINE_INVALID");
  }
  if (!Array.isArray(cond)) {
    throw new Error("OACIQ_RULE_ENGINE_INVALID");
  }
  return {
    requiredActions: req,
    forbiddenActions: forb,
    conditionalChecks: cond as OaciqRuleEngineBundle["conditionalChecks"],
  };
}

function asRiskLevel(v: string | null | undefined): OaciqComplianceRiskLevel {
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH") return v;
  return "MEDIUM";
}

/**
 * Load active section from DB, evaluate rules, persist inspection log + audit event.
 */
export async function runOaciqSectionEvaluation(input: {
  sectionKey: string;
  brokerUserId: string;
  context: Record<string, unknown>;
  dealId?: string | null;
  listingId?: string | null;
}) {
  const section = await prisma.oaciqComplianceSection.findFirst({
    where: { sectionKey: input.sectionKey, active: true },
  });

  if (!section) {
    throw new Error("OACIQ_SECTION_NOT_FOUND");
  }

  const engine = asRuleEngine(section.ruleEngineJson);
  const defaultRisk = asRiskLevel(section.defaultRiskLevel);
  const result = evaluateOaciqRuleEngine(engine, input.context, defaultRisk);

  await prisma.oaciqComplianceEvaluationLog.create({
    data: {
      sectionId: section.id,
      brokerUserId: input.brokerUserId,
      dealId: input.dealId ?? undefined,
      listingId: input.listingId ?? undefined,
      outcome: result.outcome,
      complianceRiskScore: result.complianceRiskScore,
      contextJson: input.context,
      triggeredRulesJson: {
        blockedReasons: result.blockedReasons,
        warnings: result.warnings,
        triggeredConditionalRules: result.triggeredConditionalRules,
      },
      blockedActionsJson:
        result.blockedReasons.length > 0 ? { reasons: result.blockedReasons } : undefined,
    },
  });

  await recordAuditEvent({
    actorUserId: input.brokerUserId,
    action: "OACIQ_COMPLIANCE_EVALUATION",
    payload: {
      sectionKey: input.sectionKey,
      outcome: result.outcome,
      complianceRiskScore: result.complianceRiskScore,
      dealId: input.dealId ?? null,
      listingId: input.listingId ?? null,
    },
  });

  return { section, result };
}

export function parseAiBehavior(raw: unknown): OaciqAiBehaviorBundle {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("OACIQ_AI_BEHAVIOR_INVALID");
  }
  const o = raw as Record<string, unknown>;
  const c = o.AI_CHECKLIST;
  const w = o.AI_WARNINGS;
  const b = o.AI_BLOCKS;
  if (!Array.isArray(c) || !Array.isArray(w) || !Array.isArray(b)) {
    throw new Error("OACIQ_AI_BEHAVIOR_INVALID");
  }
  return {
    AI_CHECKLIST: c.filter((x): x is string => typeof x === "string"),
    AI_WARNINGS: w.filter((x): x is string => typeof x === "string"),
    AI_BLOCKS: b.filter((x): x is string => typeof x === "string"),
  };
}
