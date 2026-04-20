import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

export const fraudRiskDetector: DarlinkMarketplaceDetector = {
  id: "fraud_risk",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      for (const l of snapshot.listings) {
        if (l.fraudFlag) {
          const id = signalKey("fraud_risk", "listing", l.id, "fraud_flagged");
          out.push({
            id,
            type: "fraud_risk",
            severity: "critical",
            entityType: "listing",
            entityId: l.id,
            reasonCode: "fraud_flagged",
            metrics: { fraud: 1 },
            explanation: "Listing has fraud flag — sensitive actions must be blocked pending review.",
          });
        }
      }
      for (const b of snapshot.bookings) {
        if (b.fraudFlag) {
          const id = signalKey("fraud_risk", "booking", b.id, "fraud_flagged");
          out.push({
            id,
            type: "fraud_risk",
            severity: "critical",
            entityType: "booking",
            entityId: b.id,
            reasonCode: "fraud_flagged",
            metrics: { fraud: 1 },
            explanation: "Booking has fraud flag — halt payout and payment automation.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
