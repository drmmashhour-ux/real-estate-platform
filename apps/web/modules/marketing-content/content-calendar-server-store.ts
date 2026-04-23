import type { MarketingContentStore } from "./content-calendar-storage";

function empty(): MarketingContentStore {
  return { items: {}, notifications: [] };
}

export function getServerMarketingContentStore(): MarketingContentStore {
  const g = globalThis as typeof globalThis & {
    __lecipmMarketingContentStore?: MarketingContentStore;
  };
  if (!g.__lecipmMarketingContentStore) g.__lecipmMarketingContentStore = empty();
  return g.__lecipmMarketingContentStore;
}

export function replaceServerMarketingContentStore(store: MarketingContentStore): void {
  const g = globalThis as typeof globalThis & {
    __lecipmMarketingContentStore?: MarketingContentStore;
  };
  g.__lecipmMarketingContentStore = JSON.parse(JSON.stringify(store)) as MarketingContentStore;
}
