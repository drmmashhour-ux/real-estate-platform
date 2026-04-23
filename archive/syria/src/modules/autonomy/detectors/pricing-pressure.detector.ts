import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

function numPrice(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export const pricingPressureDetector: DarlinkMarketplaceDetector = {
  id: "pricing_pressure",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const byCity = new Map<string, number[]>();
      for (const l of snapshot.listings) {
        if (l.status !== "PUBLISHED") continue;
        const p = numPrice(l.price);
        if (p === null) continue;
        const arr = byCity.get(l.city) ?? [];
        arr.push(p);
        byCity.set(l.city, arr);
      }
      for (const l of snapshot.listings) {
        if (l.status !== "PUBLISHED") continue;
        const arr = byCity.get(l.city);
        if (!arr || arr.length < 3) continue;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = sorted[Math.floor(sorted.length / 2)];
        const price = numPrice(l.price);
        if (price === null || mid <= 0) continue;
        const ratio = price / mid;
        if (ratio >= 1.35 || ratio <= 0.65) {
          const id = signalKey("pricing_pressure", "listing", l.id, "median_deviation");
          out.push({
            id,
            type: "pricing_pressure",
            severity: ratio >= 1.6 || ratio <= 0.5 ? "warning" : "info",
            entityType: "listing",
            entityId: l.id,
            reasonCode: "median_deviation",
            metrics: { priceRatio: Math.round(ratio * 100) / 100, cityMedian: mid },
            explanation: "Price deviates materially from peer median in the same city — review comps.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
