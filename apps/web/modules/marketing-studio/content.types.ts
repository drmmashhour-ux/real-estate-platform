/**
 * Marketing Studio — structured content (videos, posters, scripts, campaigns).
 * v1: persisted in the browser; future: API + Prisma.
 */

export type MarketingContentType = "VIDEO" | "POSTER" | "TEXT" | "CAMPAIGN";

export type MarketingPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE";

export type MarketingAudience = "broker" | "investor" | "buyer" | "host";

export type MarketingGoal = "leads" | "awareness" | "conversion";

export type VideoSceneId = "hook" | "problem" | "solution" | "cta";

export type VideoScene = {
  id: VideoSceneId;
  label: string;
  /** Primary on-screen or VO line */
  text: string;
  /** Optional sub line / text overlay */
  overlay?: string;
  /** Optional data URL for keyframe; future: attachment id from asset library */
  imageDataUrl?: string;
  videoDataUrl?: string;
};

export type VideoProject = {
  id: string;
  title: string;
  contentId: string;
  platform: MarketingPlatform;
  audience: MarketingAudience;
  goal: MarketingGoal;
  scenes: VideoScene[];
  createdAt: string;
  updatedAt: string;
};

export type MarketingContentItem = {
  id: string;
  title: string;
  type: MarketingContentType;
  platform: MarketingPlatform;
  audience: MarketingAudience;
  goal: MarketingGoal;
  /** Linked script / caption text */
  scriptId?: string;
  /** Linked video structure */
  videoProjectId?: string;
  /** Plain caption for social (short) */
  caption?: string;
  /** Tags for search and campaigns */
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type StudioScriptBlock = {
  hook: string;
  mainMessage: string;
  cta: string;
  fullScript: string;
};

export type MarketingAssetType = "image" | "video" | "script";

export type MarketingAsset = {
  id: string;
  type: MarketingAssetType;
  title: string;
  /** Comma or space separated when editing; stored normalized */
  tags: string[];
  /** Script text, or data URL, or base note */
  data: string;
  contentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExportKind = "script" | "caption" | "image" | "video_json";

export type ContentExportBundle = {
  contentId: string;
  kind: ExportKind;
  filename: string;
  mime: string;
  body: string;
};
