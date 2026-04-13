"use client";

import { getClientLeadAttributionForBeacon } from "@/lib/attribution/social-traffic";

/**
 * Flat fields consumed by `getLeadAttributionFromRequest` + `pickBodyTrafficOverride` on POST /api/auth/register.
 */
export function getRegisterTrafficFieldsForBody(): {
  trafficSource?: string;
  trafficCampaign?: string;
  trafficMedium?: string;
} {
  if (typeof window === "undefined") return {};
  const a = getClientLeadAttributionForBeacon();
  const out: { trafficSource?: string; trafficCampaign?: string; trafficMedium?: string } = {};
  if (a.source && a.source !== "direct") out.trafficSource = a.source;
  if (a.campaign) out.trafficCampaign = a.campaign;
  if (a.medium) out.trafficMedium = a.medium;
  return out;
}
