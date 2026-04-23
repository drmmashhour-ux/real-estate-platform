import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

const QUALITY_WARN = 55;

export const trustRiskDetector: DarlinkMarketplaceDetector = {
  id: "trust_risk",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      for (const l of snapshot.listings) {
        const q = l.qualityScoreApprox;
        if (q !== null && q < QUALITY_WARN) {
          const id = signalKey("trust_risk", "listing", l.id, "low_quality_score");
          out.push({
            id,
            type: "trust_risk",
            severity: q < 40 ? "critical" : "warning",
            entityType: "listing",
            entityId: l.id,
            reasonCode: "low_quality_score",
            metrics: { qualityApprox: q },
            explanation: "Listing quality/trust indicators are weak — improve content before boosting visibility.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
