import type { GrowthConnectorAdapter } from "./types";
import { MetaAdsConnector } from "./metaAdsConnector";
import { GoogleAdsConnector } from "./googleAdsConnector";
import { TikTokAdsConnector } from "./tiktokAdsConnector";
import { WhatsAppBusinessConnector } from "./whatsappBusinessConnector";
import {
  InternalEmailConnector,
  InternalHomepageConnector,
  InternalSearchBoostConnector,
} from "./internalConnectors";

const adapters: GrowthConnectorAdapter[] = [
  new MetaAdsConnector(),
  new GoogleAdsConnector(),
  new TikTokAdsConnector(),
  new WhatsAppBusinessConnector(),
  new InternalHomepageConnector(),
  new InternalSearchBoostConnector(),
  new InternalEmailConnector(),
];

const byCode = new Map(adapters.map((a) => [a.code, a]));

export function getGrowthConnectorAdapter(code: string): GrowthConnectorAdapter | undefined {
  return byCode.get(code);
}
