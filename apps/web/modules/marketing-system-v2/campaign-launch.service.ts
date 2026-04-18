/**
 * One-click campaign orchestration — creates marketing blog draft + copy pack (no auto-publish).
 */
import { MarketingBlogPostStatus } from "@prisma/client";
import { generateMarketingCreatives, generateMarketingCopy } from "@/modules/marketing/marketing-generator.service";
import { createMarketingBlogPost, ensureUniqueSlug } from "@/modules/blog/blog.service";
import { prisma } from "@/lib/db";

export type LaunchCampaignFromListingResult = {
  blogPostId: string;
  slug: string;
  posterHeadline: string;
  distributionNote: string;
};

export async function launchCampaignFromListing(
  listingId: string,
  userId: string
): Promise<LaunchCampaignFromListingResult | { error: string }> {
  const listing = await prisma.fsboListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true, title: true, city: true, description: true, priceCents: true },
  });
  if (!listing) return { error: "Listing not found or access denied" };

  const city = listing.city?.trim() || "Montréal";
  const input = {
    target: "buyer" as const,
    city,
    tone: "modern" as const,
    objective: "list_property" as const,
  };
  const copy = generateMarketingCopy(input);
  const creative = generateMarketingCreatives(input);

  const title = `${listing.title} — ${city}`;
  const slug = await ensureUniqueSlug(listing.title);
  const content = [
    `## ${creative.posterHeadline}`,
    "",
    creative.posterSubhead,
    "",
    copy.descriptions[0] ?? "",
    "",
    `_${creative.posterCta}_`,
    "",
    "---",
    "",
    listing.description.slice(0, 8000),
  ].join("\n");

  const post = await createMarketingBlogPost({
    userId,
    title,
    slug,
    content,
    status: MarketingBlogPostStatus.DRAFT,
    tags: ["listing", "fsbo", city.toLowerCase().replace(/\s+/g, "-")],
    seoTitle: `${listing.title} | ${city}`,
    seoDescription: (copy.descriptions[0] ?? creative.listingPromotionBlurb).slice(0, 500),
  });

  return {
    blogPostId: post.id,
    slug: post.slug,
    posterHeadline: creative.posterHeadline,
    distributionNote:
      "Blog saved as draft. Open Marketing → Blog to publish, then use Distribution to copy social posts (no auto-post).",
  };
}
