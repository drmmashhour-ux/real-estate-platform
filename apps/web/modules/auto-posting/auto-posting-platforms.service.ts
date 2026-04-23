import type { PlatformCapabilities, PostingPlatform } from "./auto-posting.types";

export const PLATFORM_CONFIGS: Record<PostingPlatform, PlatformCapabilities> = {
  INSTAGRAM: {
    platform: "INSTAGRAM",
    supportsDirectPost: true,
    supportsVideo: true,
    supportsImage: true,
    supportsCaption: true,
    schedulingRules: "Optimal windows: 9am-11am, 7pm-9pm. Max 3 per day.",
    rateLimitNotes: "Meta Graph API limits apply.",
  },
  FACEBOOK: {
    platform: "FACEBOOK",
    supportsDirectPost: true,
    supportsVideo: true,
    supportsImage: true,
    supportsCaption: true,
    schedulingRules: "Weekday mornings are best. Max 5 per day.",
  },
  LINKEDIN: {
    platform: "LINKEDIN",
    supportsDirectPost: true,
    supportsVideo: true,
    supportsImage: true,
    supportsCaption: true,
    schedulingRules: "B2B hours: Tues-Thu, 8am-10am. Max 2 per day.",
  },
  YOUTUBE_SHORTS: {
    platform: "YOUTUBE_SHORTS",
    supportsDirectPost: false, // Metadata only metadata flow in v1
    supportsVideo: true,
    supportsImage: false,
    supportsCaption: true,
    schedulingRules: "Evenings and weekends. Max 1 per day.",
    rateLimitNotes: "YouTube Data API v3 quota is expensive.",
  },
  TIKTOK: {
    platform: "TIKTOK",
    supportsDirectPost: false, // Fallback to export bridge in v1
    supportsVideo: true,
    supportsImage: false,
    supportsCaption: true,
    schedulingRules: "High frequency allowed. 3-5 per day.",
    rateLimitNotes: "Tiktok Content Posting API pending approval.",
  },
};

export type DispatchResult = {
  success: boolean;
  platformPostId?: string;
  error?: string;
  fallbackTriggered?: boolean;
};

export async function postToInstagram(payload: any): Promise<DispatchResult> {
  console.log("Posting to Instagram...", payload);
  // Simulated API call
  return { success: true, platformPostId: "ig_" + Math.random().toString(36).slice(2) };
}

export async function postToFacebookPage(payload: any): Promise<DispatchResult> {
  console.log("Posting to FB Page...", payload);
  return { success: true, platformPostId: "fb_" + Math.random().toString(36).slice(2) };
}

export async function postToLinkedIn(payload: any): Promise<DispatchResult> {
  console.log("Posting to LinkedIn...", payload);
  return { success: true, platformPostId: "li_" + Math.random().toString(36).slice(2) };
}

export async function postToYouTubeShortsMetadata(payload: any): Promise<DispatchResult> {
  console.log("Queueing YouTube Shorts metadata...", payload);
  return { success: true, platformPostId: "yt_" + Math.random().toString(36).slice(2) };
}

export async function queueTikTokExport(payload: any): Promise<DispatchResult> {
  console.log("TikTok direct posting limited, queueing export fallback...");
  return { success: true, fallbackTriggered: true };
}
