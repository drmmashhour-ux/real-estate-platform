import type { APIRequestContext, Page } from "@playwright/test";
import type { GrowthEventName, GrowthUiLocale } from "../../lib/growth/types";
import { e2eStep } from "./logger";

export type ApiRequestInit = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  data?: unknown;
  headers?: Record<string, string>;
};

/** Uses Playwright request context (inherits session cookies when applicable). */
export async function apiRequest(
  request: APIRequestContext,
  url: string,
  init: ApiRequestInit = {},
): Promise<{ ok: boolean; status: number; text: string; json: () => Promise<unknown> }> {
  const method = init.method ?? "GET";
  const r = await request.fetch(url, {
    method,
    data: init.data,
    headers: init.headers ?? (init.data !== undefined ? { "Content-Type": "application/json" } : undefined),
  });
  const text = await r.text();
  return {
    ok: r.ok(),
    status: r.status(),
    text,
    json: async () => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return null;
      }
    },
  };
}

/** Beacon to `/api/growth/manager-track` — uses caller’s cookies when `page` is authenticated. */
export async function trackGrowthEvent(
  page: Page,
  origin: string,
  args: {
    event: GrowthEventName;
    locale?: GrowthUiLocale;
    listingId?: string;
    path?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  e2eStep("growth_track", { event: args.event });
  const r = await page.request.post(`${origin.replace(/\/$/, "")}/api/growth/manager-track`, {
    data: {
      event: args.event,
      locale: args.locale,
      listingId: args.listingId,
      path: args.path,
      metadata: args.metadata,
    },
    headers: { "Content-Type": "application/json" },
  });
  return r.ok();
}

export async function switchLocaleCookie(page: Page, origin: string, locale: GrowthUiLocale): Promise<void> {
  const url = origin.replace(/\/$/, "");
  await page.context().addCookies([{ name: "mi_locale", value: locale, url }]);
}

/** Re-export Stripe paid simulation from scenario lib (real Checkout + webhook). */
export { runBnhubStripePaidSimulation as simulateStripeSuccess } from "../scenarios/lib/bnhub-stripe-paid-flow";

/** Invalid signature / empty body — real routes must reject (no mock). */
export async function simulateStripeFailure(request: APIRequestContext, origin: string): Promise<{
  webhookStatus: number;
  checkoutStatus: number;
}> {
  const base = origin.replace(/\/$/, "");
  const wh = await request.post(`${base}/api/stripe/webhook`, {
    data: { bogus: true },
    headers: { "Content-Type": "application/json", "stripe-signature": "t=0,v1=invalid" },
  });
  const co = await request.post(`${base}/api/stripe/checkout`, {
    data: {},
    headers: { "Content-Type": "application/json" },
  });
  return { webhookStatus: wh.status(), checkoutStatus: co.status() };
}
