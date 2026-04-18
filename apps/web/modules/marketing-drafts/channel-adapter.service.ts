import type { ListingMarketingDraftChannel } from "@prisma/client";

export function adaptBodyForChannel(
  channel: ListingMarketingDraftChannel,
  body: string,
): { body: string; title?: string } {
  switch (channel) {
    case "sms_short":
      return { body: body.slice(0, 300) };
    case "social_post":
      return { body: body.slice(0, 2000) };
    case "ad_copy":
      return { body: body.split("\n").slice(0, 3).join(" • ").slice(0, 400) };
    case "listing_page":
    case "email":
    case "internal_brief":
    default:
      return { body };
  }
}
