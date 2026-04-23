import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

export const payoutStressDetector: DarlinkMarketplaceDetector = {
  id: "payout_stress",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const pend = snapshot.aggregates.payoutsPending;
      const paid = snapshot.aggregates.payoutsPaid;
      if (pend >= 5 && pend > paid * 2) {
        const id = signalKey("payout_stress", "payout", null, "pending_backlog");
        out.push({
          id,
          type: "payout_stress",
          severity: pend >= 15 ? "critical" : "warning",
          entityType: "payout",
          entityId: null,
          reasonCode: "pending_backlog",
          metrics: { payoutsPending: pend, payoutsPaid: paid },
          explanation: "Payout backlog dominates paid volume — risk of host friction.",
        });
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
