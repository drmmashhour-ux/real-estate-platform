/** Ads / attribution campaigns — slim row for admin campaigns client. */

export type MarketingCampaignAdminRow = {
  id: string;
  name: string;
  slug: string | null;
  landingPath: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};
