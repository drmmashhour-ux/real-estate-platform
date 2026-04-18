import {
  analyzeMarketplaceGrowth,
  buildFlywheelActions,
  prioritizeFlywheelInsights,
} from "@/modules/marketplace/flywheel.service";
import { MarketplaceFlywheelPanel } from "@/components/growth/MarketplaceFlywheelPanel";

/** Server-only: loads deterministic flywheel snapshot for admin growth surfaces. */
export async function MarketplaceFlywheelSection() {
  const insights = await analyzeMarketplaceGrowth();
  const priorities = prioritizeFlywheelInsights(insights);
  const actions = buildFlywheelActions(insights);
  return <MarketplaceFlywheelPanel insights={insights} actions={actions} priorities={priorities} />;
}
