import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";

/** Single-purpose detector module — deterministic; read-only snapshot in. */
export type DarlinkMarketplaceDetector = {
  readonly id: string;
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[];
};
