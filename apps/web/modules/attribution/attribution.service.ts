import { getLeadAttributionFromRequest, type LeadAttribution } from "@/lib/attribution/lead-attribution";
import { parseUtmFromSearchParams, parseUtmFromUrl, type UtmPayload } from "./utm-parser";

export type ResolvedGrowthAttribution = UtmPayload & {
  /** Normalized first-touch style source (may be `direct`). */
  source: string | null;
  referrer: string | null;
};

function mergeUtm(cookieAttr: LeadAttribution, urlUtm: UtmPayload): UtmPayload {
  return {
    utmSource: urlUtm.utmSource ?? (cookieAttr.source && cookieAttr.source !== "direct" ? cookieAttr.source : null),
    utmMedium: urlUtm.utmMedium ?? cookieAttr.medium ?? null,
    utmCampaign: urlUtm.utmCampaign ?? cookieAttr.campaign ?? null,
    utmTerm: urlUtm.utmTerm,
    utmContent: urlUtm.utmContent,
  };
}

/**
 * Resolve attribution for `growth_events` from middleware cookie + optional current URL/body
 * (same philosophy as `getLeadAttributionFromRequest`, extended with full UTM set).
 */
export function resolveGrowthAttributionFromRequest(input: {
  cookieHeader: string | null | undefined;
  body?: unknown;
  pageUrl?: string | null;
  referrerHeader?: string | null;
}): ResolvedGrowthAttribution {
  const lead = getLeadAttributionFromRequest(input.cookieHeader, input.body);
  const fromPage = parseUtmFromUrl(input.pageUrl ?? undefined);
  const utm = mergeUtm(lead, fromPage);
  const ref = input.referrerHeader?.trim().slice(0, 2048) ?? null;
  return {
    ...utm,
    source: lead.source,
    referrer: ref,
  };
}

/** When only URL query string is available (e.g. tests). */
export function resolveUtmFromQueryString(qs: string): UtmPayload {
  const s = qs.startsWith("?") ? qs : `?${qs}`;
  return parseUtmFromUrl(`https://local${s}`);
}
