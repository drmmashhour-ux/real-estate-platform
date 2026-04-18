/**
 * Read-only access to `syria_*` tables via Prisma `$queryRaw` on shared `DATABASE_URL`.
 * No imports from `apps/syria`; no writes; no throws (empty + notes on failure).
 */
import { Prisma } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toInt(x: bigint | number | null | undefined): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === "bigint") return Number(x);
  if (typeof x === "number") return Math.floor(x);
  return 0;
}

function flagOn(): boolean {
  return engineFlags.syriaRegionAdapterV1 === true;
}

function disabledNotes(): string[] {
  return ["syria_region_adapter_disabled"];
}

export type SyriaReadResult<T> = {
  data: T | null;
  availabilityNotes: string[];
};

export type SyriaListingReadRow = {
  id: string;
  title: string;
  description: string;
  price: unknown;
  currency: string;
  /** SyriaPropertyType enum as text */
  type: string;
  city: string;
  ownerId: string;
  status: string;
  fraudFlag: boolean;
  isFeatured: boolean;
  featuredUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  bookingCount: number;
};

export type SyriaListingsSummaryRead = {
  totalListings: number;
  pendingReviewListings: number;
  featuredListings: number;
  fraudFlaggedListings: number;
  stalePublishedListings: number;
  totalBookings: number;
  cancelledBookings: number;
  bnhubStaysListings: number;
  bookingGrossHint: number | null;
  payoutsPending: number;
  payoutsApproved: number;
  payoutsPaid: number;
  listingPaymentsVerifiedHint: number;
};

export type SyriaBookingStatsRead = {
  bookingCount: number;
  bookingsWithFraudFlag: number;
  guestPaidCount: number;
  payoutPendingCount: number;
  payoutPaidCount: number;
  cancelledCount: number;
  sumTotalPriceHint: number | null;
};

export type SyriaUserStatsRead = {
  userId: string;
  propertiesOwned: number;
  guestBookings: number;
  hostPayoutsPending: number;
};

export type SyriaUserReadRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
};

export async function getSyriaListingById(listingId: string): Promise<SyriaReadResult<SyriaListingReadRow>> {
  const notes: string[] = [];
  const id = typeof listingId === "string" ? listingId.trim() : "";
  if (!flagOn()) return { data: null, availabilityNotes: [...disabledNotes()] };
  if (!id) return { data: null, availabilityNotes: ["syria_listing_id_missing"] };

  try {
    const rows = await prisma.$queryRaw<
      {
        id: string;
        title: string;
        description: string;
        price: unknown;
        currency: string;
        type: string;
        city: string;
        owner_id: string;
        status: string;
        fraud_flag: boolean;
        is_featured: boolean;
        featured_until: Date | null;
        created_at: Date;
        updated_at: Date;
        booking_count: bigint | number | null;
      }[]
    >(Prisma.sql`
      SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.currency,
        p.type::text AS type,
        p.city,
        p.owner_id,
        p.status::text AS status,
        p.fraud_flag,
        p.is_featured,
        p.featured_until,
        p.created_at,
        p.updated_at,
        (SELECT COUNT(*)::bigint FROM syria_bookings b WHERE b.property_id = p.id)::bigint AS booking_count
      FROM syria_properties p
      WHERE p.id = ${id}
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) {
      notes.push("syria_listing_not_found");
      return { data: null, availabilityNotes: notes };
    }
    return {
      data: {
        id: r.id,
        title: r.title,
        description: r.description,
        price: r.price,
        currency: r.currency ?? "SYP",
        type: r.type,
        city: r.city,
        ownerId: r.owner_id,
        status: r.status,
        fraudFlag: Boolean(r.fraud_flag),
        isFeatured: Boolean(r.is_featured),
        featuredUntil: r.featured_until,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        bookingCount: toInt(r.booking_count ?? 0),
      },
      availabilityNotes: notes,
    };
  } catch {
    notes.push("syria_read_query_failed");
    return { data: null, availabilityNotes: notes };
  }
}

export async function listSyriaListingsSummary(): Promise<SyriaReadResult<SyriaListingsSummaryRead>> {
  const notes: string[] = [];
  if (!flagOn()) return { data: null, availabilityNotes: [...disabledNotes()] };

  try {
    const rows = await prisma.$queryRaw<
      {
        total_listings: bigint | number | null;
        pending_review: bigint | number | null;
        featured: bigint | number | null;
        fraud_flagged: bigint | number | null;
        stale_published: bigint | number | null;
        total_bookings: bigint | number | null;
        cancelled_bookings: bigint | number | null;
        bnhub_listings: bigint | number | null;
        booking_gross: unknown | null;
        payouts_pending: bigint | number | null;
        payouts_approved: bigint | number | null;
        payouts_paid: bigint | number | null;
        listing_payments_verified: bigint | number | null;
      }[]
    >(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::bigint FROM syria_properties) AS total_listings,
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE status::text = 'PENDING_REVIEW') AS pending_review,
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE is_featured = true) AS featured,
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE fraud_flag = true) AS fraud_flagged,
        (
          SELECT COUNT(*)::bigint FROM syria_properties p
          WHERE p.status::text = 'PUBLISHED'
            AND p.updated_at < NOW() - INTERVAL '90 days'
        ) AS stale_published,
        (SELECT COUNT(*)::bigint FROM syria_bookings) AS total_bookings,
        (SELECT COUNT(*)::bigint FROM syria_bookings WHERE status::text = 'CANCELLED') AS cancelled_bookings,
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE type::text = 'BNHUB') AS bnhub_listings,
        (SELECT COALESCE(SUM(total_price), 0) FROM syria_bookings WHERE status::text <> 'CANCELLED') AS booking_gross,
        (SELECT COUNT(*)::bigint FROM syria_payouts WHERE status::text = 'PENDING') AS payouts_pending,
        (SELECT COUNT(*)::bigint FROM syria_payouts WHERE status::text = 'APPROVED') AS payouts_approved,
        (SELECT COUNT(*)::bigint FROM syria_payouts WHERE status::text = 'PAID') AS payouts_paid,
        (SELECT COUNT(*)::bigint FROM syria_listing_payments WHERE status::text = 'VERIFIED') AS listing_payments_verified
    `);
    const r = rows[0];
    if (!r) {
      notes.push("syria_summary_empty_row");
      return { data: null, availabilityNotes: notes };
    }
    return {
      data: {
        totalListings: toInt(r.total_listings ?? 0),
        pendingReviewListings: toInt(r.pending_review ?? 0),
        featuredListings: toInt(r.featured ?? 0),
        fraudFlaggedListings: toInt(r.fraud_flagged ?? 0),
        stalePublishedListings: toInt(r.stale_published ?? 0),
        totalBookings: toInt(r.total_bookings ?? 0),
        cancelledBookings: toInt(r.cancelled_bookings ?? 0),
        bnhubStaysListings: toInt(r.bnhub_listings ?? 0),
        bookingGrossHint: num(r.booking_gross),
        payoutsPending: toInt(r.payouts_pending ?? 0),
        payoutsApproved: toInt(r.payouts_approved ?? 0),
        payoutsPaid: toInt(r.payouts_paid ?? 0),
        listingPaymentsVerifiedHint: toInt(r.listing_payments_verified ?? 0),
      },
      availabilityNotes: notes,
    };
  } catch {
    notes.push("syria_summary_query_failed");
    return { data: null, availabilityNotes: notes };
  }
}

export async function getSyriaBookingStats(propertyId: string): Promise<SyriaReadResult<SyriaBookingStatsRead>> {
  const notes: string[] = [];
  const id = typeof propertyId === "string" ? propertyId.trim() : "";
  if (!flagOn()) return { data: null, availabilityNotes: [...disabledNotes()] };
  if (!id) return { data: null, availabilityNotes: ["syria_property_id_missing"] };

  try {
    const rows = await prisma.$queryRaw<
      {
        booking_count: bigint | number | null;
        fraud_bookings: bigint | number | null;
        guest_paid: bigint | number | null;
        payout_pending: bigint | number | null;
        payout_paid: bigint | number | null;
        cancelled: bigint | number | null;
        sum_total: unknown | null;
      }[]
    >(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS booking_count,
        COUNT(*) FILTER (WHERE fraud_flag = true)::bigint AS fraud_bookings,
        COUNT(*) FILTER (WHERE guest_payment_status::text = 'PAID')::bigint AS guest_paid,
        COUNT(*) FILTER (WHERE payout_status::text = 'PENDING')::bigint AS payout_pending,
        COUNT(*) FILTER (WHERE payout_status::text = 'PAID')::bigint AS payout_paid,
        COUNT(*) FILTER (WHERE status::text = 'CANCELLED')::bigint AS cancelled,
        COALESCE(SUM(total_price) FILTER (WHERE status::text <> 'CANCELLED'), 0) AS sum_total
      FROM syria_bookings
      WHERE property_id = ${id}
    `);
    const r = rows[0];
    if (!r) {
      notes.push("syria_booking_stats_empty");
      return { data: null, availabilityNotes: notes };
    }
    return {
      data: {
        bookingCount: toInt(r.booking_count ?? 0),
        bookingsWithFraudFlag: toInt(r.fraud_bookings ?? 0),
        guestPaidCount: toInt(r.guest_paid ?? 0),
        payoutPendingCount: toInt(r.payout_pending ?? 0),
        payoutPaidCount: toInt(r.payout_paid ?? 0),
        cancelledCount: toInt(r.cancelled ?? 0),
        sumTotalPriceHint: num(r.sum_total),
      },
      availabilityNotes: notes,
    };
  } catch {
    notes.push("syria_booking_stats_query_failed");
    return { data: null, availabilityNotes: notes };
  }
}

export async function getSyriaUserStats(userId: string): Promise<SyriaReadResult<SyriaUserStatsRead>> {
  const notes: string[] = [];
  const id = typeof userId === "string" ? userId.trim() : "";
  if (!flagOn()) return { data: null, availabilityNotes: [...disabledNotes()] };
  if (!id) return { data: null, availabilityNotes: ["syria_user_id_missing"] };

  try {
    const rows = await prisma.$queryRaw<
      {
        owned: bigint | number | null;
        guest_bookings: bigint | number | null;
        host_pending: bigint | number | null;
      }[]
    >(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE owner_id = ${id}) AS owned,
        (SELECT COUNT(*)::bigint FROM syria_bookings WHERE guest_id = ${id}) AS guest_bookings,
        (SELECT COUNT(*)::bigint FROM syria_payouts WHERE host_id = ${id} AND status::text = 'PENDING') AS host_pending
    `);
    const r = rows[0];
    if (!r) {
      notes.push("syria_user_stats_empty");
      return { data: null, availabilityNotes: notes };
    }
    return {
      data: {
        userId: id,
        propertiesOwned: toInt(r.owned ?? 0),
        guestBookings: toInt(r.guest_bookings ?? 0),
        hostPayoutsPending: toInt(r.host_pending ?? 0),
      },
      availabilityNotes: notes,
    };
  } catch {
    notes.push("syria_user_stats_query_failed");
    return { data: null, availabilityNotes: notes };
  }
}

export async function getSyriaUserRow(userId: string): Promise<SyriaReadResult<SyriaUserReadRow>> {
  const notes: string[] = [];
  const id = typeof userId === "string" ? userId.trim() : "";
  if (!flagOn()) return { data: null, availabilityNotes: [...disabledNotes()] };
  if (!id) return { data: null, availabilityNotes: ["syria_user_id_missing"] };

  try {
    const rows = await prisma.$queryRaw<
      { id: string; email: string; name: string | null; role: string; created_at: Date }[]
    >(Prisma.sql`
      SELECT id, email, name, role::text AS role, created_at
      FROM syria_users
      WHERE id = ${id}
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) {
      notes.push("syria_user_not_found");
      return { data: null, availabilityNotes: notes };
    }
    return {
      data: {
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        createdAt: r.created_at,
      },
      availabilityNotes: notes,
    };
  } catch {
    notes.push("syria_user_read_failed");
    return { data: null, availabilityNotes: notes };
  }
}

/** Alias for aggregate dashboard — same data as `listSyriaListingsSummary`. */
export async function getSyriaRegionSummary(): Promise<SyriaReadResult<SyriaListingsSummaryRead>> {
  return listSyriaListingsSummary();
}

export type SyriaFlaggedListingRead = {
  id: string;
  title: string;
  city: string;
  fraudFlag: boolean;
  fraudBookingCount: number;
  riskScore: number;
};

export async function listSyriaFlaggedListings(limit = 20): Promise<SyriaReadResult<SyriaFlaggedListingRead[]>> {
  const notes: string[] = [];
  if (!flagOn()) return { data: null, availabilityNotes: [...disabledNotes()] };
  const lim = Math.min(Math.max(0, Math.floor(limit)), 50);
  if (lim === 0) return { data: [], availabilityNotes: notes };

  try {
    const rows = await prisma.$queryRaw<
      {
        id: string;
        title: string;
        city: string;
        fraud_flag: boolean;
        fraud_bookings: bigint | number | null;
        risk_score: unknown | null;
      }[]
    >(Prisma.sql`
      SELECT
        p.id,
        p.title,
        p.city,
        p.fraud_flag,
        (SELECT COUNT(*)::bigint FROM syria_bookings b WHERE b.property_id = p.id AND b.fraud_flag = true)::bigint AS fraud_bookings,
        (
          (CASE WHEN p.fraud_flag THEN 50 ELSE 0 END) +
          COALESCE((SELECT COUNT(*)::int FROM syria_bookings b2 WHERE b2.property_id = p.id AND b2.fraud_flag = true), 0) * 10
        )::int AS risk_score
      FROM syria_properties p
      WHERE p.fraud_flag = true
         OR EXISTS (SELECT 1 FROM syria_bookings b3 WHERE b3.property_id = p.id AND b3.fraud_flag = true)
      ORDER BY risk_score DESC, p.updated_at DESC
      LIMIT ${lim}
    `);
    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        city: r.city,
        fraudFlag: Boolean(r.fraud_flag),
        fraudBookingCount: toInt(r.fraud_bookings ?? 0),
        riskScore: num(r.risk_score) ?? 0,
      })),
      availabilityNotes: notes,
    };
  } catch {
    notes.push("syria_flagged_listings_query_failed");
    return { data: null, availabilityNotes: notes };
  }
}
