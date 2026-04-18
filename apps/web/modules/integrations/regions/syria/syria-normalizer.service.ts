import type {
  SyriaNormalizedBooking,
  SyriaNormalizedListing,
  SyriaNormalizedPayout,
  SyriaNormalizedUser,
  SyriaRegionSummary,
} from "./syria-region.types";
import type {
  SyriaBookingStatsRead,
  SyriaFlaggedListingRead,
  SyriaListingReadRow,
  SyriaListingsSummaryRead,
  SyriaUserReadRow,
  SyriaUserStatsRead,
} from "./syria-read-adapter.service";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function iso(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d;
  try {
    return d.toISOString();
  } catch {
    return "";
  }
}

function payoutHintFromBookingStats(stats: SyriaBookingStatsRead | null): SyriaNormalizedListing["payoutStateHint"] {
  if (!stats || stats.bookingCount === 0) return "clear";
  const pend = stats.payoutPendingCount;
  const paid = stats.payoutPaidCount;
  if (pend >= 3 && pend > paid) return "pending_heavy";
  if (stats.bookingsWithFraudFlag > 0 || pend > 0) return "mixed";
  return "clear";
}

/** Deterministic normalization — never throws (invalid input yields minimal empty shapes). */
export function normalizeSyriaListing(
  row: SyriaListingReadRow | null | undefined,
  bookingStats?: SyriaBookingStatsRead | null,
): SyriaNormalizedListing | null {
  if (!row?.id) return null;
  const stats = bookingStats ?? null;
  const bookingCountHint = typeof row.bookingCount === "number" ? row.bookingCount : stats?.bookingCount ?? null;
  return {
    id: row.id,
    source: "syria",
    regionCode: "sy",
    title: typeof row.title === "string" ? row.title : "",
    description: typeof row.description === "string" ? row.description : "",
    price: num(row.price),
    currency: typeof row.currency === "string" && row.currency ? row.currency : "SYP",
    listingType: typeof row.type === "string" ? row.type : "UNKNOWN",
    city: typeof row.city === "string" ? row.city : "",
    ownerId: typeof row.ownerId === "string" ? row.ownerId : "",
    status: typeof row.status === "string" ? row.status : "UNKNOWN",
    fraudFlag: Boolean(row.fraudFlag),
    isFeatured: Boolean(row.isFeatured),
    featuredUntil: row.featuredUntil ? iso(row.featuredUntil) : null,
    bookingCountHint,
    payoutStateHint: payoutHintFromBookingStats(stats),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export type SyriaBookingNormalizeInput = {
  id: string;
  propertyId: string;
  guestId: string;
  totalPrice: unknown;
  currency?: string | null;
  status: string;
  guestPaymentStatus: string;
  payoutStatus: string;
  fraudFlag: boolean;
  checkIn: Date | string;
  checkOut: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function normalizeSyriaBooking(raw: SyriaBookingNormalizeInput | null | undefined): SyriaNormalizedBooking | null {
  if (!raw?.id) return null;
  return {
    id: raw.id,
    source: "syria",
    regionCode: "sy",
    propertyId: raw.propertyId,
    guestId: raw.guestId,
    totalPriceHint: num(raw.totalPrice),
    currency: raw.currency && typeof raw.currency === "string" ? raw.currency : "SYP",
    bookingStatus: raw.status,
    guestPaymentStatus: raw.guestPaymentStatus,
    payoutStatus: raw.payoutStatus,
    fraudFlag: Boolean(raw.fraudFlag),
    checkIn: iso(raw.checkIn),
    checkOut: iso(raw.checkOut),
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };
}

export function normalizeSyriaUser(
  user: SyriaUserReadRow | null | undefined,
  stats: SyriaUserStatsRead | null | undefined,
): SyriaNormalizedUser | null {
  if (!user?.id) return null;
  const s = stats ?? {
    userId: user.id,
    propertiesOwned: 0,
    guestBookings: 0,
    hostPayoutsPending: 0,
  };
  return {
    id: user.id,
    source: "syria",
    regionCode: "sy",
    email: typeof user.email === "string" ? user.email : "",
    name: user.name ?? null,
    role: typeof user.role === "string" ? user.role : "USER",
    propertiesOwned: Math.max(0, s.propertiesOwned),
    guestBookings: Math.max(0, s.guestBookings),
    hostPayoutsPending: Math.max(0, s.hostPayoutsPending),
    createdAt: iso(user.createdAt),
  };
}

export type SyriaPayoutNormalizeInput = {
  id: string;
  bookingId: string;
  hostId: string;
  amount: unknown;
  platformFee: unknown;
  currency?: string | null;
  status: string;
  approvedAt?: Date | string | null;
  paidAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function normalizeSyriaPayout(raw: SyriaPayoutNormalizeInput | null | undefined): SyriaNormalizedPayout | null {
  if (!raw?.id) return null;
  return {
    id: raw.id,
    source: "syria",
    regionCode: "sy",
    bookingId: raw.bookingId,
    hostId: raw.hostId,
    amountHint: num(raw.amount),
    platformFeeHint: num(raw.platformFee),
    currency: raw.currency && typeof raw.currency === "string" ? raw.currency : "SYP",
    status: raw.status,
    approvedAt: raw.approvedAt ? iso(raw.approvedAt) : null,
    paidAt: raw.paidAt ? iso(raw.paidAt) : null,
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };
}

export function normalizeSyriaRegionSummary(
  row: SyriaListingsSummaryRead | null | undefined,
  computedAtIso?: string,
): SyriaRegionSummary | null {
  if (!row) return null;
  const computedAt = computedAtIso && typeof computedAtIso === "string" ? computedAtIso : new Date().toISOString();
  return {
    totalListings: Math.max(0, row.totalListings),
    pendingReviewListings: Math.max(0, row.pendingReviewListings),
    featuredListings: Math.max(0, row.featuredListings),
    fraudFlaggedListings: Math.max(0, row.fraudFlaggedListings),
    stalePublishedListings: Math.max(0, row.stalePublishedListings ?? 0),
    totalBookings: Math.max(0, row.totalBookings),
    cancelledBookings: Math.max(0, row.cancelledBookings),
    bnhubStaysListings: Math.max(0, row.bnhubStaysListings),
    bookingGrossHint: row.bookingGrossHint,
    payoutsPending: Math.max(0, row.payoutsPending),
    payoutsApproved: Math.max(0, row.payoutsApproved),
    payoutsPaid: Math.max(0, row.payoutsPaid),
    listingPaymentsVerifiedHint: Math.max(0, row.listingPaymentsVerifiedHint),
    computedAt,
  };
}

export type SyriaNormalizedFlaggedListing = {
  id: string;
  source: "syria";
  regionCode: "sy";
  title: string;
  city: string;
  fraudFlag: boolean;
  fraudBookingCount: number;
  riskScore: number;
};

export function normalizeSyriaFlaggedListing(row: SyriaFlaggedListingRead | null | undefined): SyriaNormalizedFlaggedListing | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    source: "syria",
    regionCode: "sy",
    title: row.title,
    city: row.city,
    fraudFlag: Boolean(row.fraudFlag),
    fraudBookingCount: Math.max(0, row.fraudBookingCount),
    riskScore: Math.max(0, row.riskScore),
  };
}
