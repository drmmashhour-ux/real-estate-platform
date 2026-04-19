import {
  analyzeMarketplaceGrowth,
  buildFlywheelActions,
  prioritizeFlywheelInsights,
} from "@/modules/marketplace/flywheel.service";
import { marketplaceFlywheelFlags } from "@/config/feature-flags";
import { summarizeFlywheelLearning } from "@/modules/growth/flywheel-learning.service";
import { buildGrowthActionSuccessProfiles } from "@/modules/growth/flywheel-success-profile.service";
import { buildAutoSuggestedGrowthActions } from "@/modules/growth/flywheel-auto-suggest.service";
import { MarketplaceFlywheelPanel } from "@/components/growth/MarketplaceFlywheelPanel";
import { MarketplaceFlywheelActionsPanel } from "@/components/growth/MarketplaceFlywheelActionsPanel";
import { MarketplaceFlywheelOutcomePanel } from "@/components/growth/MarketplaceFlywheelOutcomePanel";
import { MarketplaceFlywheelAutoSuggestPanel } from "@/components/growth/MarketplaceFlywheelAutoSuggestPanel";

/** Server-only: loads deterministic flywheel snapshot for admin growth surfaces. */
export async function MarketplaceFlywheelSection() {
  const insights = await analyzeMarketplaceGrowth();
  const priorities = prioritizeFlywheelInsights(insights);
  const actions = buildFlywheelActions(insights);

  const learningSummary =
    marketplaceFlywheelFlags.marketplaceFlywheelActionsV1 ||
    marketplaceFlywheelFlags.marketplaceFlywheelOutcomesV1
      ? await summarizeFlywheelLearning().catch(() => null)
      : null;

  const autoSuggestBundle =
    marketplaceFlywheelFlags.marketplaceFlywheelV1 &&
    marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestV1 &&
    marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestPanelV1
      ? await (async () => {
          const [learningRaw, profiles] = await Promise.all([
            summarizeFlywheelLearning().catch(() => null),
            buildGrowthActionSuccessProfiles(),
          ]);
          const learning =
            learningRaw ?? { byInsightType: {}, actionTypeEffectiveness: [] };
          return buildAutoSuggestedGrowthActions({
            prioritizedInsights: priorities,
            learning,
            profiles,
          });
        })()
      : null;

  return (
    <>
      <MarketplaceFlywheelPanel
        insights={insights}
        actions={actions}
        priorities={priorities}
        learningSummary={learningSummary}
      />
      {autoSuggestBundle ? <MarketplaceFlywheelAutoSuggestPanel bundle={autoSuggestBundle} /> : null}
      {marketplaceFlywheelFlags.marketplaceFlywheelActionsV1 ? (
        <MarketplaceFlywheelActionsPanel insightsForPicker={insights.map((i) => ({ id: i.id, type: i.type }))} />
      ) : null}
      {marketplaceFlywheelFlags.marketplaceFlywheelActionsV1 &&
      marketplaceFlywheelFlags.marketplaceFlywheelOutcomesV1 ? (
        <MarketplaceFlywheelOutcomePanel outcomesEnabled />
      ) : null}
    </>
  );
}
