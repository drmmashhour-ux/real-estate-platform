/**
 * Runs detector registry in fixed order; dedupe + cap — never throws.
 */

import type { DarlinkMarketplaceSnapshot } from "./darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "./darlink-marketplace-autonomy.types";
import { marketplaceDetectorRegistry } from "./detectors/detector-registry";
import { capSignals, dedupeSignalsById } from "./detectors/detector-utils";

const MAX_SIGNALS = 220;

export function buildMarketplaceSignals(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
  try {
    const acc: MarketplaceSignal[] = [];
    for (const d of marketplaceDetectorRegistry) {
      try {
        acc.push(...d.run(snapshot));
      } catch {
        /* detector isolated */
      }
    }
    const deduped = dedupeSignalsById(acc);
    return capSignals(deduped, MAX_SIGNALS);
  } catch {
    return [];
  }
}
