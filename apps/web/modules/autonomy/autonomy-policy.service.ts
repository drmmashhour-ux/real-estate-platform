import { prisma } from "@/lib/db";
import type {
  AutonomousActionCandidate,
  AutonomyActionType,
  AutonomyMode,
  AutonomyRiskLevel,
  PolicyScopeType,
} from "@/modules/autonomy/autonomy.types";

const DEFAULT_APPROVAL_ACTIONS: AutonomyActionType[] = [
  "GENERATE_MESSAGE_DRAFT",
  "GENERATE_VISIT_PROPOSAL_DRAFT",
  "GENERATE_NEGOTIATION_BRIEF",
  "GENERATE_LISTING_OPTIMIZATION_DRAFT",
  "ROUTE_LEAD",
];
import { autonomyLog } from "@/modules/autonomy/autonomy-log";

const RISK_ORDER: AutonomyRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function riskLeq(a: AutonomyRiskLevel, b: AutonomyRiskLevel): boolean {
  return RISK_ORDER.indexOf(a) <= RISK_ORDER.indexOf(b);
}

const EXTERNAL_COMMS_ACTIONS: Set<AutonomyActionType> = new Set([
  "GENERATE_MESSAGE_DRAFT",
  "GENERATE_VISIT_PROPOSAL_DRAFT",
  "GENERATE_NEGOTIATION_BRIEF",
  "GENERATE_LISTING_OPTIMIZATION_DRAFT",
]);

export type PolicyContext = {
  brokerId?: string | null;
  domain?: string | null;
};

export type ApplicablePolicy = {
  mode: AutonomyMode;
  maxRiskLevel: AutonomyRiskLevel;
  allowedActionTypes: Set<AutonomyActionType>;
  blockedActionTypes: Set<AutonomyActionType>;
  requireApprovalFor: Set<AutonomyActionType>;
  emergencyFreeze: boolean;
  policyId: string | null;
  version: number;
};

const DEFAULT_POLICY: ApplicablePolicy = {
  mode: "ASSIST",
  maxRiskLevel: "MEDIUM",
  allowedActionTypes: new Set<AutonomyActionType>(),
  blockedActionTypes: new Set<AutonomyActionType>(),
  requireApprovalFor: new Set<AutonomyActionType>(DEFAULT_APPROVAL_ACTIONS),
  emergencyFreeze: false,
  policyId: null,
  version: 0,
};

function parseJsonStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function toActionSet(arr: string[]): Set<AutonomyActionType> {
  return new Set(arr.filter(Boolean) as AutonomyActionType[]);
}

/** Resolve policy: broker-specific active > domain > global active. Never throws. */
export async function getApplicableAutonomyPolicy(context: PolicyContext): Promise<ApplicablePolicy> {
  try {
    const rows = await prisma.autonomousPolicySetting.findMany({
      where: {
        isActive: true,
        OR: [
          { scopeType: "GLOBAL", scopeKey: "default" },
          ...(context.domain ? [{ scopeType: "DOMAIN" as PolicyScopeType, scopeKey: context.domain }] : []),
          ...(context.brokerId ? [{ scopeType: "BROKER" as PolicyScopeType, scopeKey: context.brokerId }] : []),
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    let merged = { ...DEFAULT_POLICY };
    const brokerRow = context.brokerId
      ? rows.find((r) => r.scopeType === "BROKER" && r.scopeKey === context.brokerId)
      : undefined;
    const domainRow = context.domain
      ? rows.find((r) => r.scopeType === "DOMAIN" && r.scopeKey === context.domain)
      : undefined;
    const globalRow = rows.find((r) => r.scopeType === "GLOBAL" && r.scopeKey === "default");

    const apply = (row: (typeof rows)[0]) => {
      merged = {
        ...merged,
        mode: (row.autonomyMode as AutonomyMode) ?? merged.mode,
        maxRiskLevel: (row.maxRiskLevel as AutonomyRiskLevel) ?? merged.maxRiskLevel,
        allowedActionTypes: toActionSet(parseJsonStringArray(row.allowedActionTypesJson)),
        blockedActionTypes: toActionSet(parseJsonStringArray(row.blockedActionTypesJson)),
        requireApprovalFor: toActionSet(parseJsonStringArray(row.requireApprovalForJson)),
        emergencyFreeze: row.emergencyFreeze,
        policyId: row.id,
        version: row.version,
      };
    };

    if (globalRow) apply(globalRow);
    if (domainRow) apply(domainRow);
    if (brokerRow) apply(brokerRow);

    autonomyLog.policyEvaluated({
      policyId: merged.policyId,
      mode: merged.mode,
      emergencyFreeze: merged.emergencyFreeze,
    });
    return merged;
  } catch {
    return { ...DEFAULT_POLICY };
  }
}

export function isEmergencyFrozen(policy: ApplicablePolicy): boolean {
  return policy.emergencyFreeze;
}

export function evaluateCandidateAgainstPolicy(
  candidate: AutonomousActionCandidate,
  policy: ApplicablePolicy
): { allowed: boolean; requiresApproval: boolean; blocked: boolean; blockedReasons: string[] } {
  const blockedReasons: string[] = [...candidate.blockedReasons];

  if (policy.emergencyFreeze) {
    blockedReasons.push("emergency_freeze: read-only recommendations only");
    return { allowed: false, requiresApproval: false, blocked: true, blockedReasons };
  }

  if (policy.mode === "OFF" || policy.mode === "FULL_AUTOPILOT_BLOCKED") {
    blockedReasons.push(`autonomy_mode_${policy.mode.toLowerCase()}`);
    return { allowed: false, requiresApproval: false, blocked: true, blockedReasons };
  }

  if (policy.blockedActionTypes.has(candidate.actionType)) {
    blockedReasons.push(`action_type_blocked:${candidate.actionType}`);
    return { allowed: false, requiresApproval: false, blocked: true, blockedReasons };
  }

  if (policy.allowedActionTypes.size > 0 && !policy.allowedActionTypes.has(candidate.actionType)) {
    blockedReasons.push(`action_not_on_allowlist:${candidate.actionType}`);
    return { allowed: false, requiresApproval: false, blocked: true, blockedReasons };
  }

  if (!riskLeq(candidate.riskLevel, policy.maxRiskLevel)) {
    blockedReasons.push(`risk_exceeds_policy_max:${candidate.riskLevel}>${policy.maxRiskLevel}`);
    return { allowed: false, requiresApproval: false, blocked: true, blockedReasons };
  }

  if (candidate.riskLevel === "CRITICAL" || candidate.riskLevel === "HIGH") {
    blockedReasons.push("high_risk_requires_human_escalation");
    return { allowed: true, requiresApproval: true, blocked: false, blockedReasons };
  }

  let requiresApproval =
    candidate.requiresApproval ||
    policy.requireApprovalFor.has(candidate.actionType) ||
    EXTERNAL_COMMS_ACTIONS.has(candidate.actionType);

  if (policy.mode === "ASSIST") {
    requiresApproval = true;
  }

  if (policy.mode === "APPROVAL_REQUIRED") {
    requiresApproval = true;
  }

  if (policy.mode === "SAFE_AUTOPILOT" && candidate.riskLevel === "LOW" && !EXTERNAL_COMMS_ACTIONS.has(candidate.actionType)) {
    requiresApproval = false;
  }

  if (EXTERNAL_COMMS_ACTIONS.has(candidate.actionType)) {
    requiresApproval = true;
  }

  return { allowed: true, requiresApproval, blocked: false, blockedReasons };
}

export function isActionAllowed(
  candidate: AutonomousActionCandidate,
  policy: ApplicablePolicy
): boolean {
  const ev = evaluateCandidateAgainstPolicy(candidate, policy);
  return ev.allowed && !ev.blocked;
}

export function doesActionRequireApproval(
  candidate: AutonomousActionCandidate,
  policy: ApplicablePolicy
): boolean {
  return evaluateCandidateAgainstPolicy(candidate, policy).requiresApproval;
}
