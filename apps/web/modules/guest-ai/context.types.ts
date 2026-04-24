/**
 * Guest-facing AI / recommendations — explicit context only (no dark patterns).
 */

export type GuestTripPreference = "luxury" | "family" | "business" | "budget" | "pet_friendly" | "quiet";

export type GuestBudgetRange = {
  /** Nightly price floor in major units (e.g. CAD), inclusive */
  min?: number;
  /** Nightly price ceiling in major units (e.g. CAD), inclusive */
  max?: number;
};

export type GuestBookingHistoryEntry = {
  listingId: string;
  city?: string | null;
  /** ISO date of checkout when known */
  checkOut?: string | null;
};

export type GuestBehaviorSignals = {
  /** Listing ids the guest opened from search or map (recent window — see loader) */
  viewedListingIds: string[];
  /** From explicit saves / hearts */
  likedListingIds: string[];
  bookingHistory: GuestBookingHistoryEntry[];
};

export type GuestContext = {
  location?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guestCount?: number | null;
  budgetRange?: GuestBudgetRange | null;
  preferences?: GuestTripPreference[];
  behaviorSignals: GuestBehaviorSignals;
};
