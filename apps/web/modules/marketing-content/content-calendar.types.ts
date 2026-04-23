export type ContentType = "VIDEO" | "POSTER" | "TEXT";

export type ContentPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "LINKEDIN";

export type ContentAudience = "BROKER" | "INVESTOR" | "BUYER" | "GENERAL";

export type ContentGoal = "LEADS" | "AWARENESS" | "CONVERSION";

export type ContentStatus = "IDEA" | "DRAFT" | "APPROVED" | "SCHEDULED" | "POSTED";

export type ContentPerformance = {
  views: number;
  clicks: number;
  leads: number;
  /** Attribution estimate in cents — manual or CRM-linked */
  revenueCents: number;
  engagementScore?: number;
};

export type ContentItem = {
  id: string;
  title: string;
  type: ContentType;
  platform: ContentPlatform;
  hook: string;
  script: string;
  caption: string;
  audience: ContentAudience;
  goal: ContentGoal;
  status: ContentStatus;
  /** ISO date (YYYY-MM-DD) for calendar placement */
  scheduledDate?: string;
  postedDate?: string;
  performance: ContentPerformance;
  assetUrl?: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type CalendarViewMode = "daily" | "weekly" | "monthly";

export type ContentNotificationKind = "ready_to_post" | "missing_slot" | "high_performer";

export type ContentNotification = {
  id: string;
  kind: ContentNotificationKind;
  title: string;
  body: string;
  contentId?: string;
  createdAtIso: string;
};
