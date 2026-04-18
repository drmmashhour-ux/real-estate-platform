/**
 * Optional client/server metadata extensions for growth_events — additive only.
 * Never rename existing keys; merge at ingest (see tracking.service.ts).
 */

export type CroTrackingMeta = {
  ctaId?: string;
  ctaVariant?: string;
  ctaPosition?: "hero" | "sticky" | "card";
  trustBlock?: boolean;
  trustVariant?: string;
  urgencyShown?: boolean;
  urgencyType?: "views_today" | "limited_availability";
};

export type RetargetingTrackingMeta = {
  segment?: "visitors" | "engaged" | "highIntent" | "hotLeads" | "abandonedBookings";
  messageId?: string;
  messageVariant?: string;
  urgency?: "low" | "medium" | "high";
};
