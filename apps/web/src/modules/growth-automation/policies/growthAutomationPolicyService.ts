import type { GrowthMarketingPlatform } from "@prisma/client";
import { createHash } from "crypto";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

const SUPPORTED_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;

export type GrowthPolicyConfig = {
  /** When true (default), new drafts start in pending_review. */
  humanReviewMode: boolean;
  /** Must be explicitly enabled before bulk / multi-channel auto publish is allowed server-side. */
  autoPublishAllChannelsEnabled: boolean;
  maxRetries: number;
};

export function getGrowthPolicyConfig(): GrowthPolicyConfig {
  return {
    humanReviewMode: process.env.GROWTH_HUMAN_REVIEW !== "0",
    autoPublishAllChannelsEnabled: process.env.GROWTH_AUTO_PUBLISH_ALL_CHANNELS === "1",
    maxRetries: Math.min(8, Math.max(1, Number(process.env.GROWTH_PUBLISH_MAX_RETRIES || 3))),
  };
}

export function initialDraftStatus(): "DRAFT" | "PENDING_REVIEW" {
  return getGrowthPolicyConfig().humanReviewMode ? "PENDING_REVIEW" : "DRAFT";
}

/**
 * No plain-text passwords in growth flows — reject if payload looks like a password field.
 */
export function assertNoPlaintextPassword(payload: Record<string, unknown>): void {
  const blocked = ["password", "passwd", "pwd", "secret"];
  for (const key of Object.keys(payload)) {
    const k = key.toLowerCase();
    if (blocked.some((b) => k.includes(b))) {
      throw new Error("Plain-text password fields are not accepted in growth payloads");
    }
  }
}

export function isSupportedMediaUrl(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return true;
  if (url.startsWith("/") || url.startsWith("blob:")) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return SUPPORTED_IMAGE_EXTENSIONS.test(u.pathname) || url.includes("cdn.");
  } catch {
    return false;
  }
}

export function buildPublishFingerprint(
  platform: GrowthMarketingPlatform,
  topic: string,
  scheduledDay: string | undefined,
  hook: string,
): string {
  const raw = `${platform}|${topic}|${scheduledDay ?? ""}|${hook}`;
  return createHash("sha256").update(raw).digest("hex");
}

export function canAutoPublishAllChannels(): boolean {
  return getGrowthPolicyConfig().autoPublishAllChannelsEnabled;
}

/**
 * Duplicate loop guard: same fingerprint cannot publish twice same day for same platform+topic pattern.
 */
export function isDuplicatePublication(
  existingFingerprints: Set<string>,
  fingerprint: string,
): boolean {
  return existingFingerprints.has(fingerprint);
}

export function validateDraftForPlatform(
  platform: GrowthMarketingPlatform,
  draft: DraftPayload,
): { ok: true } | { ok: false; reason: string } {
  if (!draft.hook?.trim() || !draft.body?.trim()) {
    return { ok: false, reason: "Hook and body are required" };
  }
  const mediaUrl =
    typeof draft.metadata?.mediaUrl === "string" ? draft.metadata.mediaUrl : undefined;
  if (mediaUrl && !isSupportedMediaUrl(mediaUrl)) {
    return {
      ok: false,
      reason: "Unsupported media URL (use HTTPS image links or official CDN URLs)",
    };
  }
  if (platform === "TIKTOK" && draft.body.length > 2200) {
    return { ok: false, reason: "Caption too long for TikTok constraints" };
  }
  return { ok: true };
}
