/**
 * Central read-only governance policy snapshot — v1 visibility only; no runtime enforcement changes.
 */

import {
  aiGrowthAutopilotSafeFlags,
  growthGovernanceFlags,
  growthGovernancePolicyFlags,
  growthLearningFlags,
} from "@/config/feature-flags";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";
import { getGrowthLearningReadOnlyForCadence } from "./growth-learning.service";
import {
  logGrowthGovernancePolicyBuildStarted,
  recordGrowthGovernancePolicyBuild,
} from "./growth-governance-policy-monitoring.service";
import type {
  GrowthGovernancePolicyRule,
  GrowthGovernancePolicySnapshot,
  GrowthPolicyDomain,
  GrowthPolicyMode,
} from "./growth-governance-policy.types";

const ALL_DOMAINS: GrowthPolicyDomain[] = [
  "leads",
  "ads",
  "cro",
  "content",
  "messaging",
  "autopilot",
  "learning",
  "fusion",
];

function ts(): string {
  return new Date().toISOString();
}

function rule(
  id: string,
  domain: GrowthPolicyDomain,
  mode: GrowthPolicyMode,
  rationale: string,
  source: GrowthGovernancePolicyRule["source"],
): GrowthGovernancePolicyRule {
  return { id, domain, mode, rationale, source, createdAt: ts() };
}

/**
 * Pure assembly for tests — does not throw on partial inputs.
 */
export function assembleGrowthGovernancePolicySnapshot(args: {
  governance: GrowthGovernanceDecision | null;
  learningControl: GrowthLearningControlDecision | null;
  autopilotExecutionEnabled: boolean;
  missingDataWarnings: string[];
}): GrowthGovernancePolicySnapshot {
  const rulesByDomain = new Map<GrowthPolicyDomain, GrowthGovernancePolicyRule>();

  const put = (r: GrowthGovernancePolicyRule) => {
    rulesByDomain.set(r.domain, r);
  };

  const execOn = args.autopilotExecutionEnabled;
  for (const d of ALL_DOMAINS) {
    if (d === "leads") {
      put(rule("default-leads", "leads", "approval_required", "Lead-facing automations require explicit approval paths (policy view).", "default_policy"));
    } else if (d === "ads") {
      put(rule("default-ads", "ads", "advisory_only", "Paid acquisition suggestions remain non-executing in core paths.", "default_policy"));
    } else if (d === "cro") {
      put(rule("default-cro", "cro", "advisory_only", "CRO guidance is advisory — no experiment mutations from this layer.", "default_policy"));
    } else if (d === "content") {
      put(rule("default-content", "content", "advisory_only", "Content assist outputs are drafts until human publish.", "default_policy"));
    } else if (d === "messaging") {
      put(
        rule(
          "default-messaging",
          "messaging",
          "approval_required",
          "Messaging assist remains draft / review-first (policy view).",
          "default_policy",
        ),
      );
    } else if (d === "autopilot") {
      put(
        rule(
          "default-autopilot",
          "autopilot",
          execOn ? "allowed" : "approval_required",
          execOn
            ? "Controlled execution may run only for approved autopilot actions (flags + CRM policy)."
            : "Autopilot execution flag off — suggestions and drafts remain review-gated.",
          "default_policy",
        ),
      );
    } else if (d === "learning") {
      put(rule("default-learning", "learning", "allowed", "Local learning weights may adjust within orchestration bounds unless learning control overrides.", "default_policy"));
    } else {
      put(rule("default-fusion", "fusion", "advisory_only", "Fusion intelligence is read-only and non-executing.", "default_policy"));
    }
  }

  const gov = args.governance;
  if (gov) {
    for (const dom of gov.frozenDomains) {
      const pd = dom as GrowthPolicyDomain;
      put(
        rule(
          `gov-frozen-${dom}`,
          pd,
          "frozen",
          `Governance freeze signal for ${dom} — pause scaling narratives until cleared.`,
          "governance",
        ),
      );
    }
    for (const dom of gov.blockedDomains) {
      const pd = dom as GrowthPolicyDomain;
      put(
        rule(
          `gov-blocked-${dom}`,
          pd,
          "blocked",
          `Governance blocked domain: ${dom} — do not expand automated execution here.`,
          "governance",
        ),
      );
    }
    if (gov.status === "human_review_required" || gov.status === "freeze_recommended") {
      for (const item of gov.humanReviewQueue.slice(0, 12)) {
        const pd = item.category as GrowthPolicyDomain;
        put(
          rule(
            `gov-hr-${item.id}`,
            pd,
            "approval_required",
            item.reason || "Human review required (governance queue).",
            "governance",
          ),
        );
      }
    }
  }

  const lc = args.learningControl;
  if (lc) {
    if (lc.state === "freeze_recommended") {
      put(
        rule(
          "lc-freeze-learning",
          "learning",
          "frozen",
          lc.reasons.map((r) => r.message).join("; ") || "Learning control recommends freezing adaptive shifts.",
          "learning_control",
        ),
      );
    } else if (lc.state === "monitor") {
      put(
        rule(
          "lc-monitor-learning",
          "learning",
          "advisory_only",
          "Learning control in monitor — treat weight shifts as advisory until reviewed.",
          "learning_control",
        ),
      );
    } else if (lc.state === "reset_recommended") {
      put(
        rule(
          "lc-reset-learning",
          "learning",
          "approval_required",
          "Learning control suggests reset — review before applying weight changes.",
          "learning_control",
        ),
      );
    }
  }

  const rules = ALL_DOMAINS.map((d) => rulesByDomain.get(d)).filter(Boolean) as GrowthGovernancePolicyRule[];

  const blockedDomains = rules.filter((r) => r.mode === "blocked").map((r) => r.domain);
  const frozenDomains = rules.filter((r) => r.mode === "frozen").map((r) => r.domain);
  const reviewRequiredDomains = rules.filter((r) => r.mode === "approval_required").map((r) => r.domain);

  const notes: string[] = [];
  if (args.missingDataWarnings.length) {
    notes.push(`Partial inputs: ${args.missingDataWarnings.slice(0, 5).join("; ")}`);
  }
  return {
    rules,
    blockedDomains: [...new Set(blockedDomains)],
    frozenDomains: [...new Set(frozenDomains)],
    reviewRequiredDomains: [...new Set(reviewRequiredDomains)],
    notes: notes.slice(0, 8),
    createdAt: ts(),
  };
}

export async function buildGrowthGovernancePolicySnapshot(): Promise<GrowthGovernancePolicySnapshot | null> {
  if (!growthGovernancePolicyFlags.growthGovernancePolicyV1) {
    return null;
  }

  logGrowthGovernancePolicyBuildStarted();
  const missingDataWarnings: string[] = [];

  let governance: GrowthGovernanceDecision | null = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  } else {
    missingDataWarnings.push("governance_flag_off");
  }

  let learningControl: GrowthLearningControlDecision | null = null;
  if (growthLearningFlags.growthLearningV1) {
    try {
      const lr = await getGrowthLearningReadOnlyForCadence();
      learningControl = lr?.learningControl ?? null;
    } catch {
      missingDataWarnings.push("learning_control_unavailable");
    }
  }

  const snapshot = assembleGrowthGovernancePolicySnapshot({
    governance,
    learningControl,
    autopilotExecutionEnabled: aiGrowthAutopilotSafeFlags.aiAutopilotExecutionV1,
    missingDataWarnings,
  });

  if (!governance && growthGovernanceFlags.growthGovernanceV1) {
    snapshot.notes.unshift("Governance decision unavailable — default policy only.");
  }
  if (!learningControl && growthLearningFlags.growthLearningV1) {
    snapshot.notes.unshift("Learning control unavailable — learning domain uses defaults.");
  }

  recordGrowthGovernancePolicyBuild({
    blockedCount: snapshot.blockedDomains.length,
    frozenCount: snapshot.frozenDomains.length,
    reviewCount: snapshot.reviewRequiredDomains.length,
    advisoryOnlyCount: snapshot.rules.filter((r) => r.mode === "advisory_only").length,
    notesCount: snapshot.notes.length,
    missingDataWarningCount: missingDataWarnings.length,
  });

  return snapshot;
}
