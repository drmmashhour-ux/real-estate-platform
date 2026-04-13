import { getLeadAttributionFromRequest, type LeadAttribution } from "@/lib/attribution/lead-attribution";

/** Normalized marketing channel for first 100 users reporting. */
export type AcquisitionChannel = "tiktok" | "instagram" | "facebook" | "outreach" | "direct" | "organic" | "other";

export type SignupAttributionPayload = {
  channel: AcquisitionChannel;
  utm: { source: string | null; medium: string | null; campaign: string | null };
  /** Query param `?src=` on /auth/signup (tiktok, instagram, facebook, outreach). */
  explicitSrc: string | null;
  capturedAt: string;
};

function normalizeChannel(attr: LeadAttribution, explicitSrc: string | null | undefined): AcquisitionChannel {
  const e = explicitSrc?.trim().toLowerCase();
  if (e === "tiktok" || e === "instagram" || e === "facebook" || e === "outreach") {
    return e;
  }
  const s = (attr.source ?? "").toLowerCase();
  const m = (attr.medium ?? "").toLowerCase();
  const c = (attr.campaign ?? "").toLowerCase();
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("instagram") || s === "ig") return "instagram";
  if (s.includes("facebook") || s.includes("fb") || s === "meta") return "facebook";
  if (m.includes("outreach") || s.includes("outreach") || c.includes("outreach")) return "outreach";
  if (s === "google" || m.includes("organic") || s.includes("bing")) return "organic";
  if (s && s !== "direct") return "other";
  return "direct";
}

/**
 * Build JSON persisted on `User.signupAttributionJson` at registration.
 * Uses first-touch attribution cookie + optional `traffic*` body fields from the client + `?src=` / `acquisitionChannel`.
 */
export function buildSignupAttributionPayload(
  cookieHeader: string | null | undefined,
  body: unknown,
  explicitSrcFromQuery?: string | null
): SignupAttributionPayload | null {
  const attr = getLeadAttributionFromRequest(cookieHeader, body);
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const explicitFromBody =
    typeof o.acquisitionChannel === "string"
      ? o.acquisitionChannel
      : typeof o.src === "string"
        ? o.src
        : null;
  const explicit = (explicitSrcFromQuery?.trim() || explicitFromBody?.trim() || null) as string | null;
  const channel = normalizeChannel(attr, explicit);
  const hasUtm = Boolean(attr.source && attr.source !== "direct") || attr.campaign || attr.medium;
  if (!hasUtm && channel === "direct" && !explicit) {
    return { channel: "direct", utm: { source: null, medium: null, campaign: null }, explicitSrc: null, capturedAt: new Date().toISOString() };
  }
  return {
    channel,
    utm: {
      source: attr.source ?? null,
      medium: attr.medium ?? null,
      campaign: attr.campaign ?? null,
    },
    explicitSrc: explicit,
    capturedAt: new Date().toISOString(),
  };
}
