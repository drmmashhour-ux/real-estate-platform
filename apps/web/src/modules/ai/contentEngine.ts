import { addHours, subDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  generateSEOPage,
  generatePost,
  generateEmail as generateEmailCopy,
  type SeoPageType,
} from "@/src/modules/content/contentEngine";
import { schedulePost, postNow } from "@/src/services/socialScheduler";

type AutopilotDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
  findMany: (args: object) => Promise<{ metadata: Prisma.JsonValue | null }[]>;
};

function autopilotTable(): AutopilotDelegate | null {
  const d = prisma as unknown as { autopilotContentItem?: AutopilotDelegate };
  return d.autopilotContentItem ?? null;
}

const ROTATING_SOCIAL_TOPICS = [
  "Montreal BNHub stay highlights",
  "Quebec real estate — what hosts should know",
  "Winter booking trends on LECIPM",
];

/** Map free-form topic string to programmatic SEO page type. */
export function mapTopicToSeoType(topic: string): SeoPageType {
  const t = topic.toLowerCase();
  if (t.includes("invest")) return "invest";
  if (t.includes("bnb") || t.includes("stay") || t.includes("rental")) return "bnb";
  if (t.includes("buy") || t.includes("purchase")) return "buy";
  return "neighborhood";
}

/** SEO fragment + meta (delegates to marketing `contentEngine`). */
export async function generateSEO(city: string, topic: string) {
  const type = mapTopicToSeoType(topic);
  return generateSEOPage(city.trim() || "Montreal", type);
}

/** Social-style copy; optional `topicHint` overrides rotation. */
export async function generateSocial(topicHint?: string): Promise<string> {
  const topic =
    topicHint?.trim() ||
    ROTATING_SOCIAL_TOPICS[Math.floor(Math.random() * ROTATING_SOCIAL_TOPICS.length)]!;
  return generatePost(topic);
}

/** Email subject + HTML; optional brief for the campaign. */
export async function generateEmail(brief?: string) {
  return generateEmailCopy(brief ?? "Weekly LECIPM + BNHub digest for subscribers.");
}

export type DailyAutopilotContentResult = {
  created: number;
  published: number;
  ids: string[];
};

/**
 * Daily autopilot: generate SEO + social + email, persist to `autopilot_content_items`, mark published.
 */
export async function runDailyAutopilotContent(options?: {
  city?: string;
  publish?: boolean;
}): Promise<DailyAutopilotContentResult> {
  const city = options?.city?.trim() || process.env.AUTOPILOT_DEFAULT_CITY?.trim() || "Montreal";
  const publish = options?.publish ?? true;
  const status = publish ? "published" : "draft";
  const publishedAt = publish ? new Date() : null;

  const topicHints = ["neighborhood guide", "invest outlook", "buy", "bnb stays"];
  const topic = topicHints[Math.floor(Math.random() * topicHints.length)]!;

  const [seo, social, email] = await Promise.all([
    generateSEO(city, topic),
    generateSocial(`${city} — ${topic}`),
    generateEmail(`${city} marketplace update: ${topic}`),
  ]);

  const table = autopilotTable();
  if (!table) {
    return { created: 0, published: 0, ids: [] };
  }

  const rSeo = await table.create({
    data: {
      kind: "seo",
      city,
      topic,
      title: seo.title,
      bodyHtml: seo.bodyHtml,
      plainText: seo.metaDescription,
      status,
      publishedAt,
      metadata: { metaDescription: seo.metaDescription, source: "autopilot" },
    },
  });
  const rSocial = await table.create({
    data: {
      kind: "social",
      city,
      topic,
      title: `Social — ${city}`,
      plainText: social,
      status,
      publishedAt,
      metadata: { source: "autopilot" },
    },
  });
  const rEmail = await table.create({
    data: {
      kind: "email",
      city,
      topic,
      title: email.subject,
      bodyHtml: email.html,
      plainText: email.subject,
      status,
      publishedAt,
      metadata: { source: "autopilot" },
    },
  });
  const rows = [rSeo, rSocial, rEmail];

  return {
    created: rows.length,
    published: publish ? rows.length : 0,
    ids: rows.map((r) => r.id),
  };
}

export type DailySocialPipelineResult = {
  autopilotItemId: string;
  scheduledPostId: string;
  publishedAttempt: { posted: number; failed: number };
};

/**
 * CEO marketing lane: generate copy, queue LinkedIn post, run publish sweep, persist with engagement proxy.
 */
export async function runDailySocialPostPipeline(options?: {
  city?: string;
}): Promise<DailySocialPipelineResult | null> {
  const city = options?.city?.trim() || process.env.AUTOPILOT_DEFAULT_CITY?.trim() || "Montreal";
  const text = await generateSocial(`AI CEO daily — ${city}`);
  const { id: scheduledPostId } = await schedulePost(
    "linkedin",
    { text: text.slice(0, 2200), url: process.env.NEXT_PUBLIC_APP_URL || "https://lecipm.com" },
    addHours(new Date(), 1),
    null
  );
  const publishedAttempt = await postNow(5);
  const table = autopilotTable();
  if (!table) {
    return null;
  }
  const row = await table.create({
    data: {
      kind: "social",
      city,
      topic: "ceo_daily_social",
      title: `CEO marketing — ${city}`,
      plainText: text,
      status: "published",
      publishedAt: new Date(),
      metadata: {
        source: "ai_ceo_marketing",
        scheduledPostId,
        engagement: {
          posted: publishedAttempt.posted,
          failed: publishedAttempt.failed,
          trackedAt: new Date().toISOString(),
        },
      },
    },
  });
  return { autopilotItemId: row.id, scheduledPostId, publishedAttempt };
}

/** Engagement proxy from autopilot social rows tagged by AI CEO (post sweep outcomes in metadata). */
export async function getMarketingEngagementStats(sinceDays = 7): Promise<{
  ceoPosts: number;
  posted: number;
  failed: number;
}> {
  const table = autopilotTable();
  if (!table) {
    return { ceoPosts: 0, posted: 0, failed: 0 };
  }
  const since = subDays(new Date(), sinceDays);
  const rows = await table.findMany({
    where: { kind: "social", createdAt: { gte: since } },
    select: { metadata: true },
    take: 300,
  });
  let ceoPosts = 0;
  let posted = 0;
  let failed = 0;
  for (const r of rows) {
    const m = r.metadata as { source?: string; engagement?: { posted?: number; failed?: number } } | null;
    if (m?.source !== "ai_ceo_marketing") continue;
    ceoPosts++;
    posted += m.engagement?.posted ?? 0;
    failed += m.engagement?.failed ?? 0;
  }
  return { ceoPosts, posted, failed };
}