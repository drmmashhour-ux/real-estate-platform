/**
 * Strict UTM + referrer parsing for growth attribution (browser or request URL).
 */

export type UtmPayload = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
};

function firstParam(params: URLSearchParams, snake: string, camel: string): string | null {
  const a = params.get(snake)?.trim();
  if (a) return a.slice(0, 256);
  const b = params.get(camel)?.trim();
  return b ? b.slice(0, 256) : null;
}

/** Parse `?utm_*` from a full URL or a query string (must start with `?` or be parseable as URL). */
export function parseUtmFromUrl(input: string | null | undefined): UtmPayload {
  if (!input?.trim()) {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }
  let search = input.trim();
  try {
    if (!search.startsWith("http://") && !search.startsWith("https://")) {
      if (!search.startsWith("?")) search = `https://x.test${search.startsWith("/") ? "" : "/"}${search}`;
    }
    const u = new URL(search.includes("://") ? search : `https://x.test${search}`);
    return parseUtmFromSearchParams(u.searchParams);
  } catch {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }
}

export function parseUtmFromSearchParams(params: URLSearchParams): UtmPayload {
  return {
    utmSource: firstParam(params, "utm_source", "utmSource"),
    utmMedium: firstParam(params, "utm_medium", "utmMedium"),
    utmCampaign: firstParam(params, "utm_campaign", "utmCampaign"),
    utmTerm: firstParam(params, "utm_term", "utmTerm"),
    utmContent: firstParam(params, "utm_content", "utmContent"),
  };
}
