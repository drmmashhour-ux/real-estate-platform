/**
 * Final gate before any live mutation — dryRun always wins.
 */

import type {
  MarketplaceActionProposal,
  MarketplaceExecutionGateEvaluation,
  MarketplaceGovernanceMode,
  MarketplacePolicyEvaluation,
} from "./darlink-marketplace-autonomy.types";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";

export type EvaluateMarketplaceExecutionGateParams = {
  policy: MarketplacePolicyEvaluation;
  governanceMode: MarketplaceGovernanceMode;
  dryRun: boolean;
  proposal: MarketplaceActionProposal;
  approvalGranted: boolean;
};

const INTERNAL_LOW_RISK: Record<string, true | undefined> = {
  CREATE_INTERNAL_TASK: true,
  ADD_INTERNAL_NOTE: true,
  FLAG_LISTING_REVIEW: true,
};

function riskRank(r: MarketplaceActionProposal["riskLevel"]): number {
  return r === "low" ? 0 : r === "medium" ? 1 : 2;
}

export function evaluateMarketplaceExecutionGate(params: EvaluateMarketplaceExecutionGateParams): MarketplaceExecutionGateEvaluation {
  try {
    const blockedReasons: string[] = [];

    if (params.dryRun) {
      return {
        allowed: false,
        requiresApproval: false,
        blockedReasons: ["dry_run_no_live_execution"],
        executableStatus: "dry_run_only",
      };
    }

    if (params.governanceMode === "OFF" || params.governanceMode === "RECOMMEND_ONLY") {
      blockedReasons.push("governance_mode_no_execution");
      return {
        allowed: false,
        requiresApproval: false,
        blockedReasons,
        executableStatus: "blocked",
      };
    }

    const flags = getDarlinkAutonomyFlags();
    if (!flags.AUTONOMY_ENABLED) {
      blockedReasons.push("autonomy_disabled");
      return { allowed: false, requiresApproval: false, blockedReasons, executableStatus: "blocked" };
    }

    const financialActions =
      params.proposal.actionType === "APPROVE_PAYOUT" ||
      params.proposal.actionType === "MARK_PAYOUT_PAID" ||
      params.proposal.actionType === "MARK_BOOKING_GUEST_PAID";

    if (financialActions && params.policy.sensitiveFinancialBlocked) {
      blockedReasons.push("policy_blocks_financial_mutations");
      return { allowed: false, requiresApproval: false, blockedReasons, executableStatus: "blocked" };
    }

    const listingPublish =
      params.proposal.actionType === "APPROVE_LISTING" || params.proposal.actionType === "REJECT_LISTING";

    if (listingPublish && params.policy.listingMutationBlocked) {
      blockedReasons.push("policy_blocks_listing_mutation");
      return { allowed: false, requiresApproval: false, blockedReasons, executableStatus: "blocked" };
    }

    if (!flags.AUTO_EXECUTE_ENABLED) {
      if (flags.APPROVALS_ENABLED) {
        if (!params.approvalGranted) {
          return {
            allowed: false,
            requiresApproval: true,
            blockedReasons: ["auto_execute_disabled_pending_approval"],
            executableStatus: "pending_approval",
          };
        }
      } else {
        blockedReasons.push("auto_execute_disabled_no_approval_channel");
        return { allowed: false, requiresApproval: false, blockedReasons, executableStatus: "blocked" };
      }
    }

    const lowInternal = INTERNAL_LOW_RISK[params.proposal.actionType] === true;

    if (params.governanceMode === "SAFE_AUTOPILOT") {
      if (!lowInternal || riskRank(params.proposal.riskLevel) > 0) {
        blockedReasons.push("safe_autopilot_internal_low_risk_only");
        return {
          allowed: flags.APPROVALS_ENABLED && params.approvalGranted,
          requiresApproval: true,
          blockedReasons,
          executableStatus: params.approvalGranted ? "ready" : "pending_approval",
        };
      }
      return { allowed: true, requiresApproval: false, blockedReasons: [], executableStatus: "ready" };
    }

    if (params.governanceMode === "FULL_AUTOPILOT_APPROVAL") {
      if (riskRank(params.proposal.riskLevel) >= 2 || financialActions || listingPublish) {
        if (!params.approvalGranted && flags.APPROVALS_ENABLED) {
          return {
            allowed: false,
            requiresApproval: true,
            blockedReasons: ["high_risk_requires_approval"],
            executableStatus: "pending_approval",
          };
        }
      }
      return {
        allowed: true,
        requiresApproval: riskRank(params.proposal.riskLevel) >= 1 && financialActions,
        blockedReasons: [],
        executableStatus: "ready",
      };
    }

    blockedReasons.push("unhandled_governance");
    return { allowed: false, requiresApproval: false, blockedReasons, executableStatus: "blocked" };
  } catch {
    return {
      allowed: false,
      requiresApproval: false,
      blockedReasons: ["gate_eval_failed"],
      executableStatus: "blocked",
    };
  }
}
