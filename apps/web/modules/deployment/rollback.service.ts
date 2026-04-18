/**
 * LECIPM Deployment Safety v1 — rollback guidance (no remote git/Vercel mutations from runtime).
 */
import { deploymentSafetyFlags } from "@/config/feature-flags";

export type RollbackPlaybook = {
  vercelRollback: string;
  gitRevert: string;
  envFlagsToDisable: string[];
  /** Snapshot of risky flags (boolean) — for support logs only; no secrets. */
  safetyFlagSnapshot: Record<string, boolean>;
};

/**
 * Human-readable steps; callers may log this during incidents.
 */
export function getRollbackPlaybook(): RollbackPlaybook {
  return {
    vercelRollback:
      "Vercel → Project → Deployments → select last good Production deployment → Promote to Production (or Rollback).",
    gitRevert: "git revert <merge-commit-sha> && git push origin main",
    envFlagsToDisable: [
      "FEATURE_ENABLE_EXPERIMENTAL_FEATURES",
      "FEATURE_ENABLE_AUTOPILOT_ACTIONS",
      "FEATURE_ENABLE_AI_CONTRACTS_V2",
      "FEATURE_ENABLE_NEW_PRICING_ENGINE",
    ],
    safetyFlagSnapshot: {
      enableNewPricingEngine: deploymentSafetyFlags.enableNewPricingEngine,
      enableAiContractsV2: deploymentSafetyFlags.enableAiContractsV2,
      enableAutopilotActions: deploymentSafetyFlags.enableAutopilotActions,
      enableExperimentalFeatures: deploymentSafetyFlags.enableExperimentalFeatures,
    },
  };
}
