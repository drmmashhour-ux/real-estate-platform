import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

const SPIKE_MIN = 50;

export const engagementSpikeDetector: DarlinkMarketplaceDetector = {
  id: "engagement_spike",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const et = snapshot.growthMetrics?.eventsByType ?? {};
      let total = 0;
      for (const v of Object.values(et)) total += v;
      const inquiryRate = snapshot.aggregates.inquiriesLast30d;
      if (total >= SPIKE_MIN || inquiryRate >= 30) {
        const id = signalKey("engagement_spike", "lead", null, "aggregate_surge");
        out.push({
          id,
          type: "engagement_spike",
          severity: total >= SPIKE_MIN * 2 ? "warning" : "info",
          entityType: "lead",
          entityId: null,
          reasonCode: "aggregate_surge",
          metrics: { growthEventsWindow: total, inquiries30d: inquiryRate },
          explanation: "Engagement/inquiry volume elevated — prioritize conversion follow-up.",
        });
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
