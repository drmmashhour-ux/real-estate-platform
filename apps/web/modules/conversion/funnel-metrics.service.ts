/**
 * Unified funnel counters (in-process per Node runtime) — visibility for conversion optimization.
 * Mirrors conversion-monitoring pattern; pair with `[funnel]` logs for operators.
 */

import { logInfo } from "@/lib/logger";

export type FunnelId = "homepage" | "get_leads" | "listings" | "property" | "broker_preview";

/** Standard step keys per STEP 1 spec */
export type FunnelStep =
  | "page_view"
  | "CTA_click"
  | "form_start"
  | "form_submit"
  | "listing_view"
  | "contact_click"
  | "preview_view";

export type FunnelSnapshot = Record<FunnelId, Partial<Record<FunnelStep, number>>>;

const funnel: FunnelSnapshot = {
  homepage: {},
  get_leads: {},
  listings: {},
  property: {},
  broker_preview: {},
};

/** A/B buckets per surface key (e.g. get_leads_submit_cta). */
export type VariantKey = "a" | "b";
type VariantSurface = string;
const variantBuckets: Record<VariantSurface, Record<VariantKey, Partial<Record<FunnelStep, number>>>> = {};

function safeLog(payload: Record<string, unknown>): void {
  try {
    logInfo("[funnel]", payload);
  } catch {
    /* noop */
  }
}

export function recordFunnelEvent(
  id: FunnelId,
  step: FunnelStep,
  opts?: { variantSurface?: string; variant?: VariantKey; meta?: Record<string, unknown> },
): void {
  try {
    funnel[id][step] = (funnel[id][step] ?? 0) + 1;
    if (opts?.variantSurface && opts?.variant) {
      const vs = opts.variantSurface;
      variantBuckets[vs] ??= { a: {}, b: {} };
      const bucket = variantBuckets[vs][opts.variant];
      bucket[step] = (bucket[step] ?? 0) + 1;
    }
    safeLog({
      event: "funnel_event",
      funnel: id,
      step,
      variantSurface: opts?.variantSurface,
      variant: opts?.variant,
      total: funnel[id][step],
      ...opts?.meta,
    });
  } catch {
    /* noop */
  }
}

export function getFunnelSnapshot(): FunnelSnapshot {
  const copy: FunnelSnapshot = {
    homepage: { ...funnel.homepage },
    get_leads: { ...funnel.get_leads },
    listings: { ...funnel.listings },
    property: { ...funnel.property },
    broker_preview: { ...funnel.broker_preview },
  };
  return copy;
}

export function getVariantBuckets(): Record<
  VariantSurface,
  Record<VariantKey, Partial<Record<FunnelStep, number>>>
> {
  return JSON.parse(JSON.stringify(variantBuckets)) as typeof variantBuckets;
}

function pct(num: number, den: number): number | null {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return null;
  return Math.round((num / den) * 10000) / 100;
}

export type FunnelRates = {
  homepage_ctr: number | null;
  get_leads_form_conversion: number | null;
  listings_ctr: number | null;
  property_contact_rate: number | null;
  broker_preview_ctr: number | null;
};

export function computeFunnelRates(): FunnelRates {
  const h = funnel.homepage;
  const gl = funnel.get_leads;
  const li = funnel.listings;
  const pr = funnel.property;
  const br = funnel.broker_preview;

  return {
    homepage_ctr: pct(h.CTA_click ?? 0, h.page_view ?? 0),
    get_leads_form_conversion: pct(gl.form_submit ?? 0, gl.form_start ?? 0),
    listings_ctr: pct(li.CTA_click ?? 0, li.listing_view ?? 0),
    property_contact_rate: pct(pr.contact_click ?? 0, pr.page_view ?? 0),
    broker_preview_ctr: pct(br.CTA_click ?? 0, br.preview_view ?? 0),
  };
}

export type FunnelDropoffIssue = {
  code: string;
  severity: "warn";
  message: string;
};

export function computeFunnelDropoffs(): FunnelDropoffIssue[] {
  const issues: FunnelDropoffIssue[] = [];
  const h = funnel.homepage;
  const gl = funnel.get_leads;
  const li = funnel.listings;
  const pr = funnel.property;

  if ((h.page_view ?? 0) >= 8 && (h.CTA_click ?? 0) === 0) {
    issues.push({
      code: "homepage_views_no_cta",
      severity: "warn",
      message: "Homepage page_view without CTA_click — verify hero CTAs fire recordFunnelEvent.",
    });
  }
  if ((gl.form_start ?? 0) >= 6 && (gl.form_submit ?? 0) === 0) {
    issues.push({
      code: "get_leads_start_no_submit",
      severity: "warn",
      message: "Many form starts but no submits — friction, validation, or API errors.",
    });
  }
  if ((li.listing_view ?? 0) >= 12 && (li.CTA_click ?? 0) === 0) {
    issues.push({
      code: "listings_view_no_cta",
      severity: "warn",
      message: "Listing views without CTA clicks — check grid CTAs / rollout guards.",
    });
  }
  if ((pr.page_view ?? 0) >= 10 && (pr.contact_click ?? 0) === 0) {
    issues.push({
      code: "property_view_no_contact",
      severity: "warn",
      message: "Property views without contact_click — sticky CTAs may be blocked.",
    });
  }
  return issues;
}

export type FunnelSuggestion = { code: string; message: string };

export function computeFunnelSuggestions(rates: FunnelRates): FunnelSuggestion[] {
  const s: FunnelSuggestion[] = [];
  if (rates.get_leads_form_conversion != null && rates.get_leads_form_conversion < 25 && (funnel.get_leads.form_start ?? 0) >= 5) {
    s.push({
      code: "shorten_or_split_form",
      message: "Lead form conversion is low vs starts — keep step-1 intent-only and tighten submit copy.",
    });
  }
  if (rates.homepage_ctr != null && rates.homepage_ctr < 8 && (funnel.homepage.page_view ?? 0) >= 15) {
    s.push({
      code: "homepage_cta_copy",
      message: "Homepage CTR is low — test stronger primary CTA labels (A/B variant b).",
    });
  }
  if (rates.listings_ctr != null && rates.listings_ctr < 5 && (funnel.listings.listing_view ?? 0) >= 20) {
    s.push({
      code: "listing_card_cta",
      message: "Listing browse → CTA rate is low — emphasize opportunity row CTA.",
    });
  }
  return s;
}

/** Compare submit/start between variants for a surface; returns null if insufficient data. */
export function pickBestVariantForSurface(surface: VariantSurface): VariantKey | null {
  const b = variantBuckets[surface];
  if (!b) return null;
  const rate = (v: VariantKey) => {
    const sub = b[v].form_submit ?? 0;
    const st = b[v].form_start ?? 0;
    return st > 0 ? sub / st : null;
  };
  const ra = rate("a");
  const rb = rate("b");
  if (ra == null && rb == null) return null;
  if (ra != null && rb != null) return ra >= rb ? "a" : "b";
  return ra != null ? "a" : "b";
}

export function resetFunnelMetricsForTests(): void {
  for (const k of Object.keys(funnel) as FunnelId[]) {
    funnel[k] = {};
  }
  for (const k of Object.keys(variantBuckets)) delete variantBuckets[k];
}

/** Deduped funnel steps for /get-leads (sessionStorage). */
export function recordGetLeadsPageViewOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem("funnel:gl:pv")) return;
    sessionStorage.setItem("funnel:gl:pv", "1");
  } catch {
    /* ignore */
  }
  recordFunnelEvent("get_leads", "page_view");
}

export function recordGetLeadsFormStartFunnel(variant: VariantKey): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem("funnel:gl:fs")) return;
    sessionStorage.setItem("funnel:gl:fs", "1");
  } catch {
    /* ignore */
  }
  recordFunnelEvent("get_leads", "form_start", {
    variantSurface: "get_leads_submit_cta",
    variant,
  });
}

export function recordGetLeadsSubmitFunnel(variant: VariantKey): void {
  recordFunnelEvent("get_leads", "form_submit", {
    variantSurface: "get_leads_submit_cta",
    variant,
  });
}

export function recordHomepagePageViewOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem("funnel:home:pv")) return;
    sessionStorage.setItem("funnel:home:pv", "1");
  } catch {
    /* ignore */
  }
  recordFunnelEvent("homepage", "page_view");
}

export function recordListingsExplorerViewOnce(pathKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const k = `funnel:lx:${pathKey}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
  recordFunnelEvent("listings", "listing_view");
}

export function recordPropertyDetailViewOnce(listingId: string): void {
  if (typeof window === "undefined") return;
  try {
    const k = `funnel:pr:${listingId}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
  recordFunnelEvent("property", "page_view");
}

export function recordBrokerPreviewSurfaceOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem("funnel:br:pv")) return;
    sessionStorage.setItem("funnel:br:pv", "1");
  } catch {
    /* ignore */
  }
  recordFunnelEvent("broker_preview", "preview_view");
}
