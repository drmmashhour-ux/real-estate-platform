import { createHash } from "crypto";
import type { GrowthContentItemStatus, GrowthMarketingPlatform } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { buildBnhubStaySeoSlug } from "@/lib/seo/public-urls";
import { getListingPhotoUrls } from "@/lib/bnhub/listings";
import { generateStructuredDraft } from "@/src/modules/growth-automation/application/_llmContent";
import {
  assertNoPlaintextPassword,
  initialDraftStatus,
  validateDraftForPlatform,
} from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";
import {
  createContentItem,
  findAnyContentItemByFingerprint,
  findFirstConnectedMarketingChannel,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { scheduleContent } from "@/src/modules/growth-automation/application/scheduleContent";
import { publishApprovedContent } from "@/src/modules/growth-automation/application/publishApprovedContent";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

const VALID_SOCIAL_AUTOPOST_PLATFORMS = new Set<string>([
  "INSTAGRAM",
  "LINKEDIN",
  "YOUTUBE",
  "TIKTOK",
]);

function listingSocialFingerprint(listingId: string, platform: GrowthMarketingPlatform) {
  return createHash("sha256").update(`bnhub_listing_social|${listingId}|${platform}`).digest("hex");
}

function parseAutopostPlatforms(raw: string | undefined): GrowthMarketingPlatform[] {
  const parts = (raw ?? "INSTAGRAM")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const out = parts.filter((p): p is GrowthMarketingPlatform =>
    VALID_SOCIAL_AUTOPOST_PLATFORMS.has(p),
  );
  return out.length > 0 ? out : ["INSTAGRAM"];
}

function autopostAction(): "review" | "schedule" | "publish" {
  const v = (process.env.SOCIAL_LISTING_AUTOPOST_ACTION ?? "review").trim().toLowerCase();
  if (v === "schedule" || v === "publish") return v;
  return "review";
}

function scheduleOffsetMinutes(): number {
  const n = Number(process.env.SOCIAL_LISTING_SCHEDULE_OFFSET_MINUTES ?? 15);
  if (!Number.isFinite(n)) return 15;
  return Math.min(10_080, Math.max(1, Math.floor(n)));
}

function toAbsoluteMediaUrl(base: string, url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  const b = base.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  try {
    return new URL(path, `${b}/`).toString();
  } catch {
    return null;
  }
}

function channelLabel(platform: GrowthMarketingPlatform): string {
  switch (platform) {
    case "INSTAGRAM":
      return "Instagram";
    case "LINKEDIN":
      return "LinkedIn";
    case "TIKTOK":
      return "TikTok";
    case "YOUTUBE":
      return "YouTube";
    default:
      return platform;
  }
}

function appendHashtagsToBody(draft: DraftPayload): DraftPayload {
  const tags = Array.isArray(draft.hashtags)
    ? draft.hashtags
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => (t.startsWith("#") ? t : `#${t.replace(/^#+/, "")}`))
    : [];
  if (tags.length === 0) return draft;
  return { ...draft, body: `${draft.body}\n\n${tags.join(" ")}` };
}

/**
 * When SOCIAL_LISTING_AUTOPOST=1, queues growth content for a listing that just moved to PUBLISHED.
 * Instagram: image + caption; can schedule or publish if a CONNECTED channel exists.
 * TikTok / YouTube: caption drafts only (no auto-publish — APIs need video).
 */
export async function queueSocialContentForPublishedListing(listingId: string): Promise<{
  ok: boolean;
  skipped?: string;
  created?: string[];
}> {
  if (process.env.SOCIAL_LISTING_AUTOPOST?.trim() !== "1") {
    return { ok: true, skipped: "disabled" };
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      listingCode: true,
      city: true,
      region: true,
      country: true,
      description: true,
      nightPriceCents: true,
      currency: true,
      beds: true,
      baths: true,
      maxGuests: true,
      listingStatus: true,
      propertyType: true,
    },
  });

  if (!listing || listing.listingStatus !== "PUBLISHED") {
    return { ok: true, skipped: "not_published" };
  }

  const baseUrl = getSiteBaseUrl();
  const staySlug = buildBnhubStaySeoSlug({
    id: listing.id,
    city: listing.city,
    propertyType: listing.propertyType,
  });
  const listingUrl = `${baseUrl}/stays/${encodeURIComponent(staySlug)}`;
  const photoUrls = await getListingPhotoUrls(listingId);
  const coverRaw = photoUrls[0] ?? "";
  const coverUrl = toAbsoluteMediaUrl(baseUrl, coverRaw);

  const platforms = parseAutopostPlatforms(process.env.SOCIAL_LISTING_AUTOPOST_PLATFORMS);
  const action = autopostAction();
  const createdIds: string[] = [];

  for (const platform of platforms) {
    const fingerprint = listingSocialFingerprint(listingId, platform);
    const existing = await findAnyContentItemByFingerprint(fingerprint);
    if (existing) continue;

    const draftOnly =
      platform === "TIKTOK" || platform === "YOUTUBE";

    if (platform === "INSTAGRAM" && !coverUrl) {
      console.warn(`[listingSocialAutopost] Skip Instagram for ${listingId}: no HTTPS cover image`);
      continue;
    }

    const channel = draftOnly ? null : await findFirstConnectedMarketingChannel(platform);
    if (!draftOnly && !channel) {
      console.warn(`[listingSocialAutopost] Skip ${platform} for ${listingId}: no CONNECTED channel`);
      continue;
    }

    const price =
      listing.nightPriceCents != null
        ? `${(listing.nightPriceCents / 100).toFixed(0)} ${listing.currency ?? ""}`.trim()
        : "";
    const loc = [listing.city, listing.region, listing.country].filter(Boolean).join(", ");

    let draft = await generateStructuredDraft({
      channelLabel: channelLabel(platform),
      topic: `New stay: ${listing.title}`,
      contentFamily: "product_demo",
      productOrFeature: "BNHub short-term rental listing",
      link: listingUrl,
      extraRules: `Listing code: ${listing.listingCode ?? "n/a"}. Location: ${loc || "n/a"}. Guests: ${listing.maxGuests ?? "n/a"}. Beds: ${listing.beds ?? "n/a"}. Baths: ${listing.baths ?? "n/a"}. Nightly from: ${price || "n/a"}. Highlight the stay and drive clicks to the link. Keep tone welcoming and professional.`,
    });

    draft = appendHashtagsToBody(draft);
    draft = {
      ...draft,
      metadata: {
        ...(draft.metadata ?? {}),
        listingId: listing.id,
        linkUrl: listingUrl,
        mediaUrl: coverUrl ?? undefined,
        contentSource: "bnhub_listing_launch",
      },
    };

    assertNoPlaintextPassword(draft as unknown as Record<string, unknown>);
    const v = validateDraftForPlatform(platform, draft);
    if (!v.ok) {
      console.warn(`[listingSocialAutopost] Validation ${platform}: ${v.reason}`);
      continue;
    }

    let status: GrowthContentItemStatus;
    let runSchedule = false;
    let runPublish = false;

    if (draftOnly) {
      status = initialDraftStatus();
    } else if (action === "publish") {
      status = "APPROVED";
      runPublish = true;
    } else if (action === "schedule") {
      status = "APPROVED";
      runSchedule = true;
    } else {
      status = initialDraftStatus();
    }

    const row = await createContentItem({
      contentType: "bnhub_listing_launch",
      topic: `${listing.title} (${listing.listingCode ?? listing.id})`,
      platform,
      status,
      draftPayload: draft,
      marketingChannelId: channel?.id ?? null,
      publishFingerprint: fingerprint,
    });
    createdIds.push(row.id);

    if (runSchedule) {
      const when = new Date(Date.now() + scheduleOffsetMinutes() * 60_000);
      await scheduleContent({ itemId: row.id, scheduledFor: when.toISOString() });
    } else if (runPublish) {
      await publishApprovedContent(row.id);
    }
  }

  return { ok: true, created: createdIds };
}
