/**
 * Internal investor / ops dashboard — all numbers are DB-backed; use `null` + labels when not computed.
 */

export type InvestorTimeWindow = "all" | "today" | "7d" | "30d";

export type InvestorDateRange = {
  start: Date | null;
  end: Date;
  label: string;
};

export type TopRuleRow = { actionKey: string; count: number };

export type InvestorMetricsSnapshot = {
  window: InvestorTimeWindow;
  generatedAt: string;
  range: InvestorDateRange;
  marketplace: {
    /** PUBLISHED STR listings */
    publishedListings: number;
    /** APPROVED but not necessarily live */
    approvedListings: number;
    draftListings: number;
    pendingReviewListings: number;
    /** DRAFT + PENDING_REVIEW */
    incompleteListings: number;
    /** Distinct hosts with at least one STR listing */
    hostsWithListings: number;
    /** Rows in `ManagerAiHostAutopilotSettings` with `autopilotEnabled` */
    hostsWithAutopilotEnabled: number;
    /** Listings with an overlapping active promotion window (as of query time) */
    listingsWithActivePromotion: number;
  };
  bookings: {
    /** Bookings whose `createdAt` falls in the window */
    createdInRange: number;
    /** Subset in range — CONFIRMED */
    confirmedInRange: number;
    /** Subset in range — COMPLETED */
    completedInRange: number;
    /** Subset in range — cancelled family */
    cancelledInRange: number;
    /** Current queue (not windowed): awaiting payment or host */
    pendingNow: number;
    /** All-time or unavailable — use null if we only expose windowed */
    totalBookingsAllTime: number;
  };
  revenue: {
    /** Sum of `Booking.totalCents` for bookings created in window — GMV proxy label in UI */
    bookingTotalCentsGmvProxyInRange: number | null;
    /** Sum of `Payment.platformFeeCents` for COMPLETED payments with `createdAt` in window */
    stripePaymentPlatformFeeCentsInRange: number | null;
    /** Sum of `BnhubHostPayoutRecord.platformFeeCents` with `createdAt` in window */
    bnhubPayoutPlatformFeeCentsInRange: number | null;
    /** Payout rows marked PAID with `releasedAt` in window (or `createdAt` if `releasedAt` null) */
    bnhubPayoutsPaidCountInRange: number;
    bnhubPayoutsPaidNetCentsInRange: number | null;
    /** Payout rows not in terminal success states */
    bnhubPayoutsPendingOrInFlightCount: number;
    bnhubPayoutsPendingOrInFlightNetCents: number | null;
  };
  ai: {
    managerRecommendationsCreatedInRange: number;
    /** Current snapshot */
    managerApprovalsPendingNow: number;
    managerActionsExecutedInRange: number;
    managerOverrideEventsInRange: number;
    managerHealthEventsInRange: number;
    managerActionLogsSuppressedInRange: number;
    topActionKeysInRange: TopRuleRow[];
    managerAgentRunsCompletedInRange: number;
    managerAgentRunsFailedInRange: number;
  };
  geography: {
    strListingsByCountry: { country: string; count: number }[];
  };
  platform: {
    syriaModeEnabled: boolean | null;
    onlinePaymentsEnabled: boolean | null;
    activeMarketCode: string | null;
  };
  users: {
    /** Users with `preferredUiLocale` set — top buckets */
    preferredUiLocaleBuckets: { locale: string; count: number }[];
  };
  growth: {
    newStrListingsCreatedInRange: number;
  };
  /** Explicit gaps — never fake */
  unavailable: string[];
};
