import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

const THRESH = 60;

export const contentQualityDetector: DarlinkMarketplaceDetector = {
  id: "content_quality_issue",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      for (const l of snapshot.listings) {
        const q = l.qualityScoreApprox;
        if (q !== null && q < THRESH) {
          const id = signalKey("content_quality_issue", "listing", l.id, "below_threshold");
          out.push({
            id,
            type: "content_quality_issue",
            severity: q < 45 ? "warning" : "info",
            entityType: "listing",
            entityId: l.id,
            reasonCode: "below_threshold",
            metrics: { qualityApprox: q },
            explanation: "Content completeness/quality below target — refresh copy and photos.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
