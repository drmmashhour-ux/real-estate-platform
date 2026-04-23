export type PostingStatus =
  | "DRAFT"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "SCHEDULED"
  | "POSTING"
  | "POSTED"
  | "FAILED"
  | "EXPORTED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIP";

export type PostingPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN"
  | "YOUTUBE_SHORTS"
  | "TIKTOK";

export type PostingContentType = "VIDEO" | "IMAGE" | "TEXT" | "CAMPAIGN";

export type PostingAutonomyMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT";

export type PlatformCapabilities = {
  platform: PostingPlatform;
  supportsDirectPost: boolean;
  supportsVideo: boolean;
  supportsImage: boolean;
  supportsCaption: boolean;
  schedulingRules: string;
  rateLimitNotes?: string;
};

export type PerformanceSnapshot = {
  impressions: number;
  clicks: number;
  leads: number;
  attributedRevenueCents: number;
  lastUpdatedIso: string;
};

export type PostingItem = {
  id: string;
  contentId: string;
  contentType: PostingContentType;
  platform: PostingPlatform;
  caption: string;
  hashtags: string[];
  targetUrl?: string;
  mediaUrl?: string;
  scheduledAt?: string; // ISO
  postedAt?: string; // ISO
  status: PostingStatus;
  approvalStatus: ApprovalStatus;
  platformPostId?: string;
  performanceSnapshot?: PerformanceSnapshot;
  createdBy: string;
  approvedBy?: string;
  lastError?: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type PostingQueueStore = {
  posts: Record<string, PostingItem>;
  autonomyMode: PostingAutonomyMode;
  lastDispatchIso?: string;
};

export type PostingAlert = {
  id: string;
  type: "NO_CONTENT" | "POST_FAILED" | "APPROVAL_BLOCKED" | "HIGH_PERFORMANCE" | "CONNECTOR_DOWN";
  message: string;
  severity: "info" | "warning" | "error";
  createdAtIso: string;
  resolvedAtIso?: string;
};
