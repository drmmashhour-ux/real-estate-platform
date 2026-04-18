/**
 * Syria DB adapter — read-only via raw SQL on shared `DATABASE_URL`.
 * Does not import apps/syria Prisma client; keeps apps/web schema isolated.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import type {
  SyriaBookingStatsForListing,
  SyriaListingRow,
  SyriaListingsSummary,
  SyriaUserRow,
  SyriaUserStats,
} from "./syria-adapter.types";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function flagEnabled(): boolean {
  return engineFlags.syriaIntegrationV1 === true;
}

/** Safe listing fetch — never throws; returns null on missing DB / disabled flag / errors. */
export async function getSyriaListingById(listingId: string): Promise<SyriaListingRow | null> {
  const id = typeof listingId === "string" ? listingId.trim() : "";
  if (!id || !flagEnabled()) return null;
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
      }[]
    >(Prisma.sql`
      SELECT
        id,
        title,
        description,
        price,
        currency,
        type::text AS type,
        city,
        owner_id,
        status::text AS status,
        fraud_flag,
        is_featured,
        featured_until,
        created_at,
        updated_at
      FROM syria_properties
      WHERE id = ${id}
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      price: num(r.price),
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
    };
  } catch {
    return null;
  }
}

export async function getSyriaListingsSummary(): Promise<SyriaListingsSummary | null> {
  if (!flagEnabled()) return null;
  try {
    const rows = await prisma.$queryRaw<
      {
        total_properties: bigint | number | null;
        published_properties: bigint | number | null;
        fraud_properties: bigint | number | null;
        total_bookings: bigint | number | null;
        booking_gross: unknown | null;
        payouts_pending: bigint | number | null;
        payouts_paid: bigint | number | null;
      }[]
    >(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::bigint FROM syria_properties) AS total_properties,
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE status = 'PUBLISHED') AS published_properties,
        (SELECT COUNT(*)::bigint FROM syria_properties WHERE fraud_flag = true) AS fraud_properties,
        (SELECT COUNT(*)::bigint FROM syria_bookings) AS total_bookings,
        (SELECT COALESCE(SUM(total_price), 0) FROM syria_bookings) AS booking_gross,
        (SELECT COUNT(*)::bigint FROM syria_bookings WHERE payout_status = 'PENDING') AS payouts_pending,
        (SELECT COUNT(*)::bigint FROM syria_payouts WHERE status IN ('APPROVED','PENDING')) AS payouts_paid
    `);
    const r = rows[0];
    if (!r) return null;
    const toInt = (x: bigint | number | null | undefined) =>
      typeof x === "bigint" ? Number(x) : typeof x === "number" ? Math.floor(x) : 0;
    return {
      totalProperties: toInt(r.total_properties ?? 0),
      publishedProperties: toInt(r.published_properties ?? 0),
      fraudFlaggedProperties: toInt(r.fraud_properties ?? 0),
      totalBookings: toInt(r.total_bookings ?? 0),
      bookingGrossHint: num(r.booking_gross),
      payoutsPendingHint: toInt(r.payouts_pending ?? 0),
      payoutsPaidHint: toInt(r.payouts_paid ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getSyriaBookingStats(listingId: string): Promise<SyriaBookingStatsForListing | null> {
  const id = typeof listingId === "string" ? listingId.trim() : "";
  if (!id || !flagEnabled()) return null;
  try {
    const rows = await prisma.$queryRaw<
      {
        booking_count: bigint | number | null;
        fraud_bookings: bigint | number | null;
        guest_paid: bigint | number | null;
        payout_pending: bigint | number | null;
        payout_paid: bigint | number | null;
        sum_total: unknown | null;
      }[]
    >(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS booking_count,
        COUNT(*) FILTER (WHERE fraud_flag = true)::bigint AS fraud_bookings,
        COUNT(*) FILTER (WHERE guest_payment_status = 'PAID')::bigint AS guest_paid,
        COUNT(*) FILTER (WHERE payout_status = 'PENDING')::bigint AS payout_pending,
        COUNT(*) FILTER (WHERE payout_status = 'PAID')::bigint AS payout_paid,
        COALESCE(SUM(total_price), 0) AS sum_total
      FROM syria_bookings
      WHERE property_id = ${id}
    `);
    const r = rows[0];
    if (!r) return null;
    const toInt = (x: bigint | number | null | undefined) =>
      typeof x === "bigint" ? Number(x) : typeof x === "number" ? Math.floor(x) : 0;
    return {
      bookingCount: toInt(r.booking_count ?? 0),
      bookingsWithFraudFlag: toInt(r.fraud_bookings ?? 0),
      guestPaidCount: toInt(r.guest_paid ?? 0),
      payoutPendingCount: toInt(r.payout_pending ?? 0),
      payoutPaidCount: toInt(r.payout_paid ?? 0),
      sumTotalPriceHint: num(r.sum_total),
    };
  } catch {
    return null;
  }
}

export async function getSyriaUserStats(userId: string): Promise<SyriaUserStats | null> {
  const id = typeof userId === "string" ? userId.trim() : "";
  if (!id || !flagEnabled()) return null;
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
        (SELECT COUNT(*)::bigint FROM syria_payouts p
          JOIN syria_bookings b ON b.id = p.booking_id
          WHERE p.host_id = ${id} AND p.status = 'PENDING') AS host_pending
    `);
    const r = rows[0];
    if (!r) return null;
    const toInt = (x: bigint | number | null | undefined) =>
      typeof x === "bigint" ? Number(x) : typeof x === "number" ? Math.floor(x) : 0;
    return {
      userId: id,
      propertiesOwned: toInt(r.owned ?? 0),
      guestBookings: toInt(r.guest_bookings ?? 0),
      hostPayoutsPending: toInt(r.host_pending ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getSyriaUserById(userId: string): Promise<SyriaUserRow | null> {
  const id = typeof userId === "string" ? userId.trim() : "";
  if (!id || !flagEnabled()) return null;
  try {
    const rows = await prisma.$queryRaw<
      {
        id: string;
        email: string;
        name: string | null;
        role: string;
        created_at: Date;
      }[]
    >(Prisma.sql`
      SELECT id, email, name, role::text AS role, created_at
      FROM syria_users
      WHERE id = ${id}
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
    };
  } catch {
    return null;
  }
}

/** Top risky Syria listings (fraud flag or booking fraud), deterministic ordering. */
export async function getSyriaRiskyListingsPreview(limit = 12): Promise<{ id: string; title: string; city: string; riskScore: number }[]> {
  if (!flagEnabled()) return [];
  const lim = Math.min(Math.max(0, Math.floor(limit)), 50);
  if (lim === 0) return [];
  try {
    const rows = await prisma.$queryRaw<{ id: string; title: string; city: string; risk_score: unknown }[]>(Prisma.sql`
      SELECT p.id, p.title, p.city,
        (CASE WHEN p.fraud_flag THEN 50 ELSE 0 END +
         COALESCE((SELECT COUNT(*) FROM syria_bookings b WHERE b.property_id = p.id AND b.fraud_flag = true), 0) * 10
        )::int AS risk_score
      FROM syria_properties p
      WHERE p.fraud_flag = true
         OR EXISTS (SELECT 1 FROM syria_bookings b WHERE b.property_id = p.id AND b.fraud_flag = true)
      ORDER BY risk_score DESC, p.updated_at DESC
      LIMIT ${lim}
    `);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      city: r.city,
      riskScore: num(r.risk_score) ?? 0,
    }));
  } catch {
    return [];
  }
}
