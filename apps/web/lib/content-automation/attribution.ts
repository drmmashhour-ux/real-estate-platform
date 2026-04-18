/**
 * UTM params for social → listing landing attribution (carry through booking / leads).
 * Convention: utm_campaign=listing_[listingId], utm_content=[style]_[contentJobId]
 * (URL segments use `/admin/content/[id]` — same id as the content job row.)
 */
export function buildListingShareUrlWithUtm(args: {
  baseUrl: string;
  listingId: string;
  platform: "tiktok" | "instagram";
  /** e.g. price_shock */
  contentStyle?: string;
  jobId?: string;
  /** @deprecated prefer contentStyle + jobId */
  campaign?: string;
  content?: string;
}): string {
  const path = args.baseUrl.replace(/\/$/, "");
  const url = new URL(`${path}/listings/${encodeURIComponent(args.listingId)}`);
  url.searchParams.set("utm_source", args.platform);
  url.searchParams.set("utm_medium", "social");
  const campaign = args.campaign ?? `listing_${args.listingId}`;
  url.searchParams.set("utm_campaign", campaign);
  const content =
    args.content ??
    (args.contentStyle && args.jobId ? `${args.contentStyle}_${args.jobId}` : args.jobId ?? undefined);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}
