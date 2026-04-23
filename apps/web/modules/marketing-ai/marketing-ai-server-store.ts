import type { MarketingAiStore } from "./marketing-ai-storage";
import { emptyMarketingAiStore } from "./marketing-ai-storage";

export function getServerMarketingAiStore(): MarketingAiStore {
  const g = globalThis as typeof globalThis & { __lecipmMarketingAiStore?: MarketingAiStore };
  if (!g.__lecipmMarketingAiStore) g.__lecipmMarketingAiStore = emptyMarketingAiStore();
  return g.__lecipmMarketingAiStore;
}

export function replaceServerMarketingAiStore(store: MarketingAiStore): void {
  const g = globalThis as typeof globalThis & { __lecipmMarketingAiStore?: MarketingAiStore };
  g.__lecipmMarketingAiStore = JSON.parse(JSON.stringify(store)) as MarketingAiStore;
}
