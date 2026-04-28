// TEMP: disable analytics to unblock UI build

export function isLiveDebugMode(): boolean {
  return false;
}

export async function trackEvent() {
  // no-op
}

export async function writeMarketplaceEvent() {
  // no-op
}
