export type TrustBreakdown = {
  completeness: number;
  verification: number;
  reviews: number;
};

export type ListingTrustScore = {
  score: number;
  badge: "low" | "medium" | "high";
  breakdown: TrustBreakdown;
};

export type AvailabilityResult = {
  bookedDates: string[];
  availableDates: string[];
};
