/**
 * Phase 9 — documented safe enablement order (does not modify .env).
 */
import type { FeatureFlagRolloutItem } from "./final-launch-report.types";

function ev(key: string): string {
  return process.env[key] ?? "(unset)";
}

function interpreted(key: string): string {
  const v = process.env[key];
  if (v === "true" || v === "1") return "on";
  if (v === "false" || v === "0") return "off";
  if (v === undefined || v === "") {
    if (key.startsWith("FEATURE_SECURITY_")) return "default_on_when_unset";
    return "off_when_unset";
  }
  return v;
}

/**
 * Ordered checklist for human rollout — re-run prelaunch after each tranche.
 */
export function buildFeatureFlagRolloutPlan(): FeatureFlagRolloutItem[] {
  const items: { order: number; envKey: string; description: string; note: string }[] = [
    { order: 1, envKey: "FEATURE_SECURITY_GLOBAL_V1", description: "Security middleware layer", note: "Keep on; opt-out only if debugging." },
    { order: 2, envKey: "FEATURE_AI_AUTOPILOT_V1", description: "AI Autopilot (assist / gated execute)", note: "Enable with FEATURE_AI_AUTOPILOT_SAFE_ACTIONS_V1 for safe mode." },
    { order: 3, envKey: "FEATURE_SOFT_LAUNCH_V1", description: "Soft launch engine + plans", note: "Requires review of launch APIs." },
    { order: 4, envKey: "FEATURE_FIRST_USERS_V1", description: "First-users acquisition pack", note: "Depends on soft launch surfaces." },
    { order: 5, envKey: "FEATURE_ADS_ENGINE_V1", description: "Internal ads draft generator", note: "No auto-spend; copy review only." },
    { order: 6, envKey: "FEATURE_MARKETING_INTELLIGENCE_V1", description: "Funnel + marketing intelligence", note: "Powers funnel-visualization + beacons." },
    { order: 7, envKey: "FEATURE_REPUTATION_ENGINE_V1", description: "Reputation engine (internal)", note: "Roll out internal/admin first." },
    { order: 8, envKey: "FEATURE_RANKING_ENGINE_V1", description: "Ranking engine (test)", note: "Internal test before public ranking changes." },
  ];

  return items.map((x) => ({
    ...x,
    rawEnv: ev(x.envKey),
    interpreted: interpreted(x.envKey),
  }));
}
