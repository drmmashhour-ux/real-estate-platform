/**
 * Internal ads campaign builder — structured drafts only (no API spend).
 */
import { generateAdsCopyBundle, type AdsAudience, type AdsCopyBundle } from "./ads-copy-generator.service";

export type InternalAdsCampaign = {
  listingId: string | null;
  city: string;
  audience: AdsAudience;
  copy: AdsCopyBundle;
  /** Human checklist before any external spend */
  externalChecklist: string[];
  utmTemplate: { source: string; medium: string; campaign: string; example: string };
};

export function buildInternalAdsCampaign(input: {
  listingId?: string | null;
  city: string;
  audience: AdsAudience;
  listingTitle?: string | null;
}): InternalAdsCampaign {
  const city = input.city.trim() || "Montréal";
  const audience = input.audience;
  const copy = generateAdsCopyBundle({
    city,
    audience,
    listingTitle: input.listingTitle ?? null,
  });

  const slug = city.toLowerCase().replace(/\s+/g, "-");
  const utmTemplate = {
    source: "google",
    medium: "cpc",
    campaign: `lecipm_soft_${slug}_v1`,
    example: `?utm_source=google&utm_medium=cpc&utm_campaign=lecipm_soft_${slug}_v1`,
  };

  return {
    listingId: input.listingId ?? null,
    city,
    audience,
    copy,
    externalChecklist: [
      "Export copy to Google Ads / Meta manually — LECIPM does not auto-push.",
      "Set daily caps in the ad platform; reconcile spend as `spend` performance events if you self-report.",
      "Use landing_view + lead_capture funnel events to validate LP before scaling.",
    ],
    utmTemplate,
  };
}
