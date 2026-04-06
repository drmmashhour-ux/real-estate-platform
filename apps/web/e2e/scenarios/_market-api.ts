import type { APIRequestContext } from "@playwright/test";
import { e2eStep } from "./_log";

/** Pass `page.request` so session cookies apply. */

export type MarketSettingsPayload = {
  activeMarketCode?: string;
  syriaModeEnabled?: boolean;
  onlinePaymentsEnabled?: boolean;
  manualPaymentTrackingEnabled?: boolean;
  contactFirstEmphasis?: boolean;
  defaultDisplayCurrency?: string;
};

export async function getMarketSettingsAdmin(
  request: APIRequestContext,
  origin: string,
): Promise<MarketSettingsPayload | null> {
  const r = await request.get(`${origin}/api/admin/market-settings`);
  if (!r.ok()) return null;
  return (await r.json()) as MarketSettingsPayload;
}

export async function patchMarketSettingsAdmin(
  request: APIRequestContext,
  origin: string,
  body: MarketSettingsPayload,
): Promise<boolean> {
  e2eStep("market_patch_api", body);
  const r = await request.patch(`${origin}/api/admin/market-settings`, {
    data: body,
    headers: { "Content-Type": "application/json" },
  });
  return r.ok();
}
