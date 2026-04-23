import type { ContentItem, ContentNotification } from "./content-calendar.types";

const STORAGE_KEY = "lecipm-marketing-content-v1";

export type MarketingContentStore = {
  items: Record<string, ContentItem>;
  notifications: ContentNotification[];
};

function empty(): MarketingContentStore {
  return { items: {}, notifications: [] };
}

let memoryStore: MarketingContentStore = empty();

export function loadMarketingContentStore(): MarketingContentStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memoryStore = { ...empty(), ...JSON.parse(raw) } as MarketingContentStore;
    } catch {
      /* ignore */
    }
  }
  return memoryStore;
}

export function saveMarketingContentStore(store: MarketingContentStore): void {
  memoryStore = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mc-${Date.now()}`;
}

export function resetMarketingContentStoreForTests(): void {
  memoryStore = empty();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}
