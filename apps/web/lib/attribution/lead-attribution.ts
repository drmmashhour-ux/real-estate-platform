import { clampAttributionPart } from "./constants";
import {
  hasMeaningfulAttribution,
  parseAttributionCookieHeader,
  type AttributionCookiePayload,
} from "./cookie-value";

export type LeadAttribution = {
  source: string | null;
  campaign: string | null;
  medium: string | null;
};

function pickBodyTrafficOverride(body: unknown): Partial<LeadAttribution> {
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  const nested = o.attribution;
  const src =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>)
      : null;
  const bag = src ?? o;
  return {
    source:
      clampAttributionPart(bag.trafficSource as string) ??
      clampAttributionPart(bag.traffic_source as string),
    campaign:
      clampAttributionPart(bag.trafficCampaign as string) ??
      clampAttributionPart(bag.traffic_campaign as string),
    medium:
      clampAttributionPart(bag.trafficMedium as string) ??
      clampAttributionPart(bag.traffic_medium as string),
  };
}

/**
 * Resolves attribution for persisting on Lead rows.
 * - First-touch cookie (middleware) is primary.
 * - Optional body fields: trafficSource, trafficCampaign, trafficMedium, or attribution: { … }.
 * - Does not use generic `body.source` (conflicts with form/channel fields on some routes).
 * - When nothing is present, source is stored as "direct".
 */
export function getLeadAttributionFromRequest(
  cookieHeader: string | null | undefined,
  body?: unknown
): LeadAttribution {
  const cookie = parseAttributionCookieHeader(cookieHeader ?? null);
  const override = pickBodyTrafficOverride(body);

  const source = override.source ?? cookie?.source ?? null;
  const campaign = override.campaign ?? cookie?.campaign ?? null;
  const medium = override.medium ?? cookie?.medium ?? null;

  if (!source && !campaign && !medium) {
    return { source: "direct", campaign: null, medium: null };
  }

  return {
    source: source ?? "direct",
    campaign,
    medium,
  };
}

export function shouldSetFirstTouchCookie(
  existing: AttributionCookiePayload | null,
  incoming: { source: string | null; campaign: string | null; medium: string | null }
): boolean {
  if (hasMeaningfulAttribution(existing)) return false;
  return Boolean(incoming.source || incoming.campaign || incoming.medium);
}
