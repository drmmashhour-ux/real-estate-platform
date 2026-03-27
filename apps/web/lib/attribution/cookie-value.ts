import { LECIPM_ATTRIBUTION_COOKIE, clampAttributionPart } from "./constants";

export type AttributionCookiePayload = {
  source: string | null;
  campaign: string | null;
  medium: string | null;
  capturedAt: string;
};

export function hasMeaningfulAttribution(p: Partial<AttributionCookiePayload> | null): boolean {
  return Boolean(p?.source || p?.campaign || p?.medium);
}

/** Parse first-touch cookie JSON from Cookie header value */
export function parseAttributionCookieHeader(cookieHeader: string | null | undefined): AttributionCookiePayload | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const prefix = `${LECIPM_ATTRIBUTION_COOKIE}=`;
  for (const part of parts) {
    if (!part.startsWith(prefix)) continue;
    let raw = part.slice(prefix.length);
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
    try {
      const decoded = decodeURIComponent(raw);
      const j = JSON.parse(decoded) as Partial<AttributionCookiePayload>;
      if (!j || typeof j !== "object") return null;
      return {
        source: clampAttributionPart(j.source as string),
        campaign: clampAttributionPart(j.campaign as string),
        medium: clampAttributionPart(j.medium as string),
        capturedAt: typeof j.capturedAt === "string" ? j.capturedAt : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
  return null;
}

export function serializeAttributionCookieValue(payload: AttributionCookiePayload): string {
  return encodeURIComponent(
    JSON.stringify({
      source: payload.source,
      campaign: payload.campaign,
      medium: payload.medium,
      capturedAt: payload.capturedAt,
    })
  );
}

/** Extract utm / lecipm params from a URL's searchParams */
export function attributionFromSearchParams(searchParams: URLSearchParams): {
  source: string | null;
  campaign: string | null;
  medium: string | null;
} {
  const source =
    clampAttributionPart(searchParams.get("source")) ??
    clampAttributionPart(searchParams.get("utm_source"));
  const campaign =
    clampAttributionPart(searchParams.get("campaign")) ??
    clampAttributionPart(searchParams.get("utm_campaign"));
  const medium =
    clampAttributionPart(searchParams.get("medium")) ??
    clampAttributionPart(searchParams.get("utm_medium"));
  return { source, campaign, medium };
}
