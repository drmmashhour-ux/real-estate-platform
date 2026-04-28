/**
 * ORDER SYBNB-112 — attribute listing visits to viral shares (`whatsapp` vs `copy_link`).
 * Append `hl_share` to public listing URLs in shared messages so recipients carry attribution on landing.
 */
export const HADIAH_SHARE_QUERY_PARAM = "hl_share";

export type HadiahShareSource = "whatsapp" | "copy_link";

/** Parse `hl_share` from listing page search params (server or client). */
export function parseHadiahShareSourceFromSearchParams(sp: {
  [key: string]: string | string[] | undefined;
}): HadiahShareSource | undefined {
  const raw =
    typeof sp[HADIAH_SHARE_QUERY_PARAM] === "string"
      ? sp[HADIAH_SHARE_QUERY_PARAM]
      : Array.isArray(sp[HADIAH_SHARE_QUERY_PARAM])
        ? sp[HADIAH_SHARE_QUERY_PARAM][0]
        : undefined;
  if (raw === "whatsapp" || raw === "copy_link") return raw;
  return undefined;
}

/** Absolute listing URL with share attribution query param. */
export function appendHadiahShareSource(absoluteUrl: string, source: HadiahShareSource): string {
  try {
    const u = new URL(absoluteUrl);
    u.searchParams.set(HADIAH_SHARE_QUERY_PARAM, source);
    return u.href;
  } catch {
    return absoluteUrl;
  }
}
