"use client";

import { getClientLeadAttributionForBeacon } from "@/lib/attribution/social-traffic";
import { getGrowthUtmForSignupBody } from "@/lib/growth/utm";

/**
 * Flat fields consumed by `getLeadAttributionFromRequest` + `pickBodyTrafficOverride` on POST /api/auth/register.
 */
export function getRegisterTrafficFieldsForBody(): {
  trafficSource?: string;
  trafficCampaign?: string;
  trafficMedium?: string;
  lecipmUtm?: { source: string | null; medium: string | null; campaign: string | null };
} {
  if (typeof window === "undefined") return {};
  const a = getClientLeadAttributionForBeacon();
  const out: {
    trafficSource?: string;
    trafficCampaign?: string;
    trafficMedium?: string;
    lecipmUtm?: { source: string | null; medium: string | null; campaign: string | null };
  } = {};
  if (a.source && a.source !== "direct") out.trafficSource = a.source;
  if (a.campaign) out.trafficCampaign = a.campaign;
  if (a.medium) out.trafficMedium = a.medium;
  const sessionUtm = getGrowthUtmForSignupBody();
  if (sessionUtm.lecipmUtm) out.lecipmUtm = sessionUtm.lecipmUtm;
  return out;
}
