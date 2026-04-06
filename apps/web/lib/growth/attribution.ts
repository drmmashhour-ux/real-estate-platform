export interface CampaignAttribution {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  locale: string | null;
  market: string | null;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

/** Parse UTM + optional locale/market hints from a URLSearchParams (browser or Request). */
export function parseCampaignAttributionFromSearchParams(
  params: URLSearchParams,
  hints?: { locale?: string | null; market?: string | null },
): CampaignAttribution {
  const get = (k: string) => {
    const v = params.get(k)?.trim();
    return v && v.length > 0 ? v.slice(0, 256) : null;
  };
  return {
    source: get("utm_source"),
    medium: get("utm_medium"),
    campaign: get("utm_campaign"),
    content: get("utm_content"),
    locale: hints?.locale?.trim()?.slice(0, 16) ?? get("ui_locale"),
    market: hints?.market?.trim()?.slice(0, 32) ?? get("market"),
  };
}

/** Serialize attribution for JSON storage on session / signup metadata. */
export function campaignAttributionToMetadata(a: CampaignAttribution): Record<string, string | null> {
  return {
    utm_source: a.source,
    utm_medium: a.medium,
    utm_campaign: a.campaign,
    utm_content: a.content,
    attr_locale: a.locale,
    attr_market: a.market,
  };
}

/** Keys used when persisting visitor acquisition context (cookie / session). */
export const ATTRIBUTION_STORAGE_KEYS = UTM_KEYS;
