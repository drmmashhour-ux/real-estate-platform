import { PlatformRole } from "@prisma/client";
import type { NormalizedSignal, ProposedAction } from "./ai-autopilot.types";
import { proposalsFromBnhubSignals } from "./actions/bnhub-autopilot.service";
import { proposalsFromListingSignals } from "./actions/listing-autopilot.service";
import { proposalsRetargetingAutopilot } from "./actions/retargeting.autopilot.adapter";
import { proposalsAbTestingAutopilot } from "./actions/ab-testing.autopilot.adapter";
import { proposalsAdsAutomationLoop } from "./actions/ads-automation-loop.autopilot.adapter";
import { proposalsAdsAiAutopilot } from "./actions/ads-ai-autopilot.adapter";
import { proposalsAdsStrategyRecommendations } from "./actions/ads-strategy-autopilot.adapter";
import { proposalsGrowthMarketing } from "./actions/growth-autopilot.service";
import { proposalsFromLeadSignals } from "./actions/lead-autopilot.service";
import { proposalsFromDealAutopilotAdapter } from "./actions/deal-autopilot-adapter.service";
import { proposalsFounderAdmin } from "./actions/founder-autopilot.service";
import { proposalsMarketplaceIntelligence } from "@/modules/marketplace-intelligence/marketplace-intelligence.autopilot.bridge";
import { operatorLayerFlags } from "@/config/feature-flags";
import { buildAssistantRecommendationFeed } from "@/modules/operator/assistant-aggregator.service";
import { assistantRecommendationsToProposedActions } from "@/modules/operator/operator-autopilot.bridge";

const ADMIN_LIKE = new Set<PlatformRole>([
  "ADMIN",
  "CONTENT_OPERATOR",
  "LISTING_OPERATOR",
  "SUPPORT_AGENT",
]);

export async function collectProposedActions(opts: {
  userId: string;
  role: PlatformRole;
  signals: NormalizedSignal[];
}): Promise<ProposedAction[]> {
  const { userId, role, signals } = opts;
  const proposals: ProposedAction[] = [];

  proposals.push(...proposalsFromBnhubSignals(signals, userId));
  proposals.push(...proposalsFromListingSignals(signals, userId));
  proposals.push(...proposalsFromLeadSignals(signals, userId));
  proposals.push(...proposalsFromDealAutopilotAdapter(userId));

  if (ADMIN_LIKE.has(role)) {
    proposals.push(...proposalsGrowthMarketing(userId));
    proposals.push(...proposalsAdsStrategyRecommendations(userId));
    proposals.push(...proposalsAdsAiAutopilot(userId));
    proposals.push(...(await proposalsAdsAutomationLoop(userId)));
    proposals.push(...proposalsAbTestingAutopilot(userId));
    proposals.push(...proposalsRetargetingAutopilot(userId));
    proposals.push(...proposalsFounderAdmin());
    proposals.push(...(await proposalsMarketplaceIntelligence(userId)));
    if (operatorLayerFlags.aiAssistantLayerV1) {
      try {
        const feed = await buildAssistantRecommendationFeed({ persist: false });
        const merged = [
          ...feed.topRecommendations,
          ...feed.blockedRecommendations.slice(0, 6).map((b) => b.recommendation),
        ];
        proposals.push(...(await assistantRecommendationsToProposedActions(merged.slice(0, 14))));
      } catch {
        /* feed optional */
      }
    }
  }

  return proposals;
}
