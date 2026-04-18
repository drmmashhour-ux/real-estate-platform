import type { LecipmCoreAutopilotEventType } from "../types";

export type ListingRuleHit = {
  ruleKey: string;
  detail?: Record<string, unknown>;
};

export type FsboListingRuleInput = {
  id: string;
  title: string;
  description: string;
  images: string[];
  city: string;
  propertyType: string | null;
  priceCents: number;
  trustScore: number | null;
  riskScore: number | null;
  status: string;
  updatedAt: Date;
  viewCount: number;
  saveCount: number;
  leadCount: number;
};

const STALE_DAYS = 45;
const MIN_TITLE = 14;
const MIN_DESC = 120;
const MIN_PHOTOS = 4;

/**
 * Deterministic listing quality / demand heuristics. No ML; safe with partial data.
 */
export function evaluateFsboListingRules(
  input: FsboListingRuleInput,
  event: LecipmCoreAutopilotEventType
): ListingRuleHit[] {
  const hits: ListingRuleHit[] = [];
  const title = (input.title ?? "").trim();
  const desc = (input.description ?? "").trim();
  const photos = Array.isArray(input.images) ? input.images.length : 0;
  const ageDays = (Date.now() - input.updatedAt.getTime()) / 86400000;

  if (title.length < MIN_TITLE) {
    hits.push({ ruleKey: "weak_title", detail: { len: title.length } });
  }
  if (desc.length < MIN_DESC) {
    hits.push({ ruleKey: "short_description", detail: { len: desc.length } });
  }
  if (photos < MIN_PHOTOS) {
    hits.push({ ruleKey: "too_few_photos", detail: { photos } });
  }
  if (input.trustScore != null && input.trustScore < 38) {
    hits.push({ ruleKey: "low_trust_score", detail: { trustScore: input.trustScore } });
  }
  if (ageDays > STALE_DAYS && input.status === "ACTIVE") {
    hits.push({ ruleKey: "stale_listing", detail: { ageDays: Math.floor(ageDays) } });
  }

  const views = Math.max(0, input.viewCount);
  const inquiries = Math.max(0, input.leadCount);
  if (views >= 80 && inquiries <= 1) {
    hits.push({
      ruleKey: "high_impressions_low_inquiries",
      detail: { views, inquiries },
    });
  }
  if (input.saveCount >= 12 && inquiries === 0) {
    hits.push({
      ruleKey: "saved_often_not_contacted",
      detail: { saves: input.saveCount, inquiries },
    });
  }

  if (event === "listing_low_quality_detected" || event === "listing_low_conversion_detected") {
    hits.push({
      ruleKey: `event:${event}`,
      detail: { source: "event" },
    });
  }

  return hits;
}
