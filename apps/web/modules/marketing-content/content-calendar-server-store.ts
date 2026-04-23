import type { MarketingContentStore } from "./content-calendar-storage";

function empty(): MarketingContentStore {
  return { items: {}, notifications: [] };
}

export function getServerMarketingContentStore(): MarketingContentStore {
  const g = globalThis as typeof globalThis & {
    __lecipmMarketingContentStore?: MarketingContentStore;
  };
  if (!g.__lecipmMarketingContentStore || typeof g.__lecipmMarketingContentStore !== "object") {
    g.__lecipmMarketingContentStore = empty();
  }
  
  // Ensure nested properties are safe
  if (!g.__lecipmMarketingContentStore.items) g.__lecipmMarketingContentStore.items = {};
  if (!Array.isArray(g.__lecipmMarketingContentStore.notifications)) {
    g.__lecipmMarketingContentStore.notifications = [];
  }
  
  return g.__lecipmMarketingContentStore;
}

export function replaceServerMarketingContentStore(store: MarketingContentStore): void {
  const g = globalThis as typeof globalThis & {
    __lecipmMarketingContentStore?: MarketingContentStore;
  };
  
  if (!store || typeof store !== "object") {
    g.__lecipmMarketingContentStore = empty();
    return;
  }

  try {
    const safeItems = store.items && typeof store.items === "object" ? store.items : {};
    const safeNotifications = Array.isArray(store.notifications) ? store.notifications : [];
    
    g.__lecipmMarketingContentStore = JSON.parse(JSON.stringify({
      items: safeItems,
      notifications: safeNotifications
    })) as MarketingContentStore;
  } catch {
    g.__lecipmMarketingContentStore = empty();
  }
}
