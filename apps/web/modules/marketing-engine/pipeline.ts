import { addHours } from "date-fns";
import type { PrismaClient } from "@prisma/client";
import { GROWTH_CITY_SLUGS, type GrowthCitySlug, growthCityDisplayName } from "@/lib/growth/geo-slugs";
import { ensureWeeklyGrowthBlogPost } from "@/modules/growth-engine/seoContentGenerator";
import { generateEmail } from "@/src/modules/content/contentEngine";
import { schedulePost, postNow } from "@/src/services/socialScheduler";
import {
  generateCityInsights,
  generateInvestmentTips,
  generateMarketUpdate,
  generatePropertyHighlights,
  toSocialSnippet,
} from "@/modules/marketing-engine/contentEngine";
import { suggestMarketingOptimization } from "@/modules/marketing-engine/optimization";

const APP = () => (process.env.NEXT_PUBLIC_APP_URL ?? "https://lecipm.com").replace(/\/$/, "");

export type RunMarketingEngineDailyResult = {
  citySlug: GrowthCitySlug;
  created: string[];
  blog?: { slug: string; created: boolean };
  scheduledSocial: number;
  publishSweep: { posted: number; failed: number };
  optimization: ReturnType<typeof suggestMarketingOptimization>;
};

function pickCitySlug(): GrowthCitySlug {
  const i = new Date().getUTCDate() % GROWTH_CITY_SLUGS.length;
  return GROWTH_CITY_SLUGS[i]!;
}

export async function runMarketingEngineDaily(
  db: PrismaClient,
  options?: {
    citySlug?: GrowthCitySlug;
    /** When true, enqueue weekly SEO blog post (same helper as growth-seo cron). */
    weeklyBlog?: boolean;
    /** Post to Instagram in addition to LinkedIn + X. */
    includeInstagram?: boolean;
  }
): Promise<RunMarketingEngineDailyResult> {
  const citySlug = options?.citySlug ?? pickCitySlug();
  const cityName = growthCityDisplayName(citySlug);
  const weeklyBlog = options?.weeklyBlog ?? process.env.MARKETING_ENGINE_WEEKLY_BLOG?.trim() === "1";
  const includeInstagram =
    options?.includeInstagram ?? process.env.MARKETING_ENGINE_INSTAGRAM?.trim() === "1";

  const cityToken = cityName.split(/\s+/)[0] ?? cityName;
  const listing = await db.fsboListing.findFirst({
    where: {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      city: { contains: cityToken, mode: "insensitive" },
    },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
  const listingPath = listing ? `/listings/${listing.id}` : `/city/${citySlug}`;

  const highlights = generatePropertyHighlights({
    city: cityName,
    listingTitle: listing?.title,
    listingPath,
  });
  const cityInsights = generateCityInsights(citySlug);
  const investTips = generateInvestmentTips(citySlug);
  const marketUpdate = generateMarketUpdate(citySlug);

  const emailCopy = await generateEmail(`Weekly LECIPM — ${cityName}: market snapshot + listings. ${toSocialSnippet(marketUpdate, 120)}`);

  const createdIds: string[] = [];
  const when = addHours(new Date(), 1);
  const baseUrl = APP();

  const emailRow = await db.marketingEngineContent.create({
    data: {
      type: "email",
      platform: "newsletter",
      title: emailCopy.subject,
      body: emailCopy.html,
      status: "published",
      publishedAt: new Date(),
      topicKey: "market_update",
      citySlug,
      listingId: listing?.id ?? null,
      metadata: { source: "ai_marketing_engine", variant: "weekly_digest" },
    },
  });
  createdIds.push(emailRow.id);

  const blogBody = [
    `# ${cityName} — AI marketing digest`,
    "",
    "## Property spotlight",
    highlights,
    "",
    "## City insights",
    cityInsights,
    "",
    "## Investment focus",
    investTips,
    "",
    "## Market update",
    marketUpdate,
    "",
    `[Browse ${cityName}](${baseUrl}/city/${citySlug}) · [Listings](${baseUrl}${listingPath})`,
  ].join("\n\n");

  const blogRow = await db.marketingEngineContent.create({
    data: {
      type: "blog",
      platform: "blog",
      title: `${cityName} real estate digest — ${new Date().toISOString().slice(0, 10)}`,
      body: blogBody,
      status: "published",
      publishedAt: new Date(),
      topicKey: "city_insights",
      citySlug,
      listingId: listing?.id ?? null,
      blogSlug: null,
      metadata: { source: "ai_marketing_engine", listingPath },
    },
  });
  createdIds.push(blogRow.id);

  const linkedinText = [toSocialSnippet(marketUpdate, 400), "", `${baseUrl}/city/${citySlug}`].join("\n");
  const xText = toSocialSnippet(`${marketUpdate.split("\n")[0]!} ${baseUrl}/city/${citySlug}`, 280);

  const liSchedule = await schedulePost("linkedin", { text: linkedinText, url: baseUrl }, when, null);
  const liRow = await db.marketingEngineContent.create({
    data: {
      type: "social",
      platform: "linkedin",
      title: `LinkedIn — ${cityName}`,
      body: linkedinText,
      status: "scheduled",
      scheduledFor: when,
      topicKey: "market_update",
      citySlug,
      externalPostId: liSchedule.id,
      metadata: { source: "ai_marketing_engine", channel: "linkedin" },
    },
  });
  createdIds.push(liRow.id);

  const xSchedule = await schedulePost("x", { text: xText, url: `${baseUrl}/city/${citySlug}` }, addHours(new Date(), 2), null);
  const xRow = await db.marketingEngineContent.create({
    data: {
      type: "social",
      platform: "twitter",
      title: `X — ${cityName}`,
      body: xText,
      status: "scheduled",
      scheduledFor: addHours(new Date(), 2),
      topicKey: "market_update",
      citySlug,
      externalPostId: xSchedule.id,
      metadata: { source: "ai_marketing_engine", channel: "x" },
    },
  });
  createdIds.push(xRow.id);

  if (includeInstagram) {
    const igText = toSocialSnippet(highlights, 2100);
    const igSchedule = await schedulePost("instagram", { text: `${igText}\n${baseUrl}/city/${citySlug}`, url: baseUrl }, addHours(new Date(), 3), null);
    const igRow = await db.marketingEngineContent.create({
      data: {
        type: "social",
        platform: "instagram",
        title: `Instagram — ${cityName}`,
        body: igText,
        status: "scheduled",
        scheduledFor: addHours(new Date(), 3),
        topicKey: "property_highlights",
        citySlug,
        externalPostId: igSchedule.id,
        metadata: { source: "ai_marketing_engine", channel: "instagram" },
      },
    });
    createdIds.push(igRow.id);
  }

  const publishSweep = await postNow(15);

  const recent = await db.marketingEngineContent.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { topicKey: true, type: true, clicks: true, engagements: true, conversions: true },
  });
  const optimization = suggestMarketingOptimization(recent);

  let blog: RunMarketingEngineDailyResult["blog"];
  if (weeklyBlog) {
    blog = await ensureWeeklyGrowthBlogPost(db, citySlug);
    await db.marketingEngineContent.update({
      where: { id: blogRow.id },
      data: {
        optimizationMeta: optimization as object,
        blogSlug: blog.slug,
        metadata: { source: "ai_marketing_engine", seoBlogSlug: blog.slug, listingPath },
      },
    });
  } else {
    await db.marketingEngineContent.update({
      where: { id: blogRow.id },
      data: { optimizationMeta: optimization as object },
    });
  }

  return {
    citySlug,
    created: createdIds,
    blog,
    scheduledSocial: includeInstagram ? 3 : 2,
    publishSweep,
    optimization,
  };
}
