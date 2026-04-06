export const PITCH_SLIDE_TYPES = [
  "title",
  "problem",
  "solution",
  "product",
  "traction",
  "business_model",
  "growth",
  "vision",
] as const;

export type PitchSlideType = (typeof PITCH_SLIDE_TYPES)[number];

export type PitchSlideSpec = {
  order: number;
  type: PitchSlideType;
  title: string;
  content: Record<string, unknown>;
};

export type PitchMetrics = {
  totalUsers: number;
  activeUsers: number;
  listings: number;
  bookings30d: number;
  revenue30d: number;
  conversionRate: number;
  /** Approximate user growth vs oldest snapshot in the fetched window (see `loadPitchMetrics`). */
  userGrowthRatePct: number;
  snapshotDate: string | null;
};
