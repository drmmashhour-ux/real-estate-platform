import { growthV3Flags } from "@/config/feature-flags";
import type { LifecycleStage } from "@/src/modules/lifecycle/lifecycle.states";

export type GrowthChannel = "in_app" | "email" | "push" | "seo" | "social" | "referral";

export type ChannelPreferences = {
  emailOptIn?: boolean;
  pushOptIn?: boolean;
  marketingEmailOptIn?: boolean;
};

/**
 * Chooses candidate channels from lifecycle + explicit consent — never overrides legal/opt-out.
 */
export function selectChannelsForUser(
  stage: LifecycleStage,
  prefs: ChannelPreferences,
): { channels: GrowthChannel[]; explanation: string[] } {
  if (!growthV3Flags.orchestrationEngineV1) {
    return { channels: ["in_app"], explanation: ["FEATURE_ORCHESTRATION_ENGINE_V1 disabled — in_app only."] };
  }

  const channels: GrowthChannel[] = ["in_app"];
  const explanation: string[] = ["in_app: always allowed for product surfaces."];

  if (prefs.emailOptIn && prefs.marketingEmailOptIn) {
    if (stage === "high_intent" || stage === "converting") {
      channels.push("email");
      explanation.push("email: opted-in + high-intent/converting stage.");
    } else if (stage === "dormant" || stage === "churn_risk") {
      channels.push("email");
      explanation.push("email: opted-in + re-engagement stage.");
    } else {
      explanation.push("email: skipped (lower urgency stage; use in_app first).");
    }
  } else {
    explanation.push("email: skipped (no marketing consent).");
  }

  if (prefs.pushOptIn && (stage === "active_searcher" || stage === "high_intent")) {
    channels.push("push");
    explanation.push("push: opted-in + active intent.");
  }

  if (stage === "explorer" || stage === "active_searcher") {
    channels.push("seo", "social");
    explanation.push("seo/social: organic surfaces only (no outbound).");
  }

  channels.push("referral");
  explanation.push("referral: program surfaces when eligible (policy-gated).");

  return { channels: [...new Set(channels)], explanation };
}
