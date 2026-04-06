/**
 * Read-only integrity checks for Supabase guest `bookings` (BNHub).
 * Used by scripts and ops — does not mutate data.
 *
 * **Overlap prevention** is enforced by `create_guest_booking` RPC (and server rules).
 * This module is a **backstop / audit** for drift, bad imports, or legacy rows.
 */

import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export type BookingIntegrityIssue = {
  severity: "error" | "warn";
  code: string;
  detail: string;
  bookingId?: string;
  listingId?: string;
};

type BookingRow = {
  id: string;
  listing_id: string;
  total_price: number | string;
  status?: string | null;
  dates?: unknown;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
};

const PAID_LIKE = new Set(["paid", "completed"]);
const ACTIVE_CHECKOUT = new Set(["pending", "processing"]);

function numTotal(raw: number | string): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseNightStrings(dates: unknown): string[] {
  if (!Array.isArray(dates)) return [];
  return dates.map((d) => String(d).trim()).filter(Boolean);
}

function pairsOverlap(a: string[], b: string[]): boolean {
  const set = new Set(a);
  return b.some((x) => set.has(x));
}

/**
 * Fetch bookings (limit for safety) and report data issues + same-listing date overlaps for non-canceled rows.
 */
export async function validateGuestSupabaseBookingsIntegrity(options?: {
  limit?: number;
}): Promise<{ ok: boolean; issues: BookingIntegrityIssue[]; scanned: number }> {
  const limit = Math.min(10_000, Math.max(100, options?.limit ?? 5000));
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return {
      ok: false,
      issues: [
        {
          severity: "error",
          code: "SUPABASE_UNAVAILABLE",
          detail: "Supabase service env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) is not configured.",
        },
      ],
      scanned: 0,
    };
  }

  const { data, error } = await sb
    .from("bookings")
    .select(
      "id, listing_id, total_price, status, dates, stripe_checkout_session_id, stripe_payment_intent_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      ok: false,
      issues: [{ severity: "error", code: "FETCH_FAILED", detail: error.message }],
      scanned: 0,
    };
  }

  const rows = (data ?? []) as BookingRow[];
  const issues: BookingIntegrityIssue[] = [];

  for (const row of rows) {
    const st = (row.status ?? "").toLowerCase();
    const total = numTotal(row.total_price);

    if (total === null || total < 0) {
      issues.push({
        severity: "error",
        code: "INVALID_TOTAL",
        bookingId: row.id,
        listingId: row.listing_id,
        detail: `total_price is missing or invalid (${String(row.total_price)})`,
      });
    }

    if (PAID_LIKE.has(st)) {
      const sid = row.stripe_checkout_session_id?.trim();
      if (!sid) {
        issues.push({
          severity: "warn",
          code: "PAID_WITHOUT_CHECKOUT_SESSION",
          bookingId: row.id,
          listingId: row.listing_id,
          detail:
            "Status is paid/completed but stripe_checkout_session_id is empty — legacy or manual row; webhook correlation may be unclear.",
        });
      }
      const pi = row.stripe_payment_intent_id?.trim();
      if (sid && !pi) {
        issues.push({
          severity: "warn",
          code: "PAID_WITHOUT_PAYMENT_INTENT",
          bookingId: row.id,
          listingId: row.listing_id,
          detail:
            "Paid/completed with checkout session but no stripe_payment_intent_id — acceptable if webhook did not expand PI yet.",
        });
      }
    }

    if (st === "processing") {
      const sid = row.stripe_checkout_session_id?.trim();
      if (!sid) {
        issues.push({
          severity: "warn",
          code: "PROCESSING_WITHOUT_SESSION",
          bookingId: row.id,
          listingId: row.listing_id,
          detail: "Status is processing but no Stripe Checkout session id stored.",
        });
      }
    }

    if (ACTIVE_CHECKOUT.has(st) && total !== null && total === 0) {
      issues.push({
        severity: "warn",
        code: "ZERO_TOTAL_ACTIVE",
        bookingId: row.id,
        listingId: row.listing_id,
        detail: "Booking is pending/processing with zero total.",
      });
    }
  }

  // Overlap detection: group by listing, only bookings that reserve nights (have dates)
  const byListing = new Map<string, BookingRow[]>();
  for (const row of rows) {
    const st = (row.status ?? "").toLowerCase();
    if (st === "canceled" || st === "cancelled") continue;
    const nights = parseNightStrings(row.dates);
    if (nights.length === 0) continue;
    const arr = byListing.get(row.listing_id) ?? [];
    arr.push(row);
    byListing.set(row.listing_id, arr);
  }

  for (const [listingId, list] of byListing) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      const a = parseNightStrings(list[i].dates);
      for (let j = i + 1; j < list.length; j++) {
        const b = parseNightStrings(list[j].dates);
        if (pairsOverlap(a, b)) {
          const stA = (list[i].status ?? "").toLowerCase();
          const stB = (list[j].status ?? "").toLowerCase();
          if (PAID_LIKE.has(stA) && PAID_LIKE.has(stB)) {
            issues.push({
              severity: "error",
              code: "OVERLAPPING_PAID_RANGES",
              listingId,
              detail: `Overlapping night dates between bookings ${list[i].id} and ${list[j].id} (verify RPC/triggers).`,
            });
          } else {
            issues.push({
              severity: "warn",
              code: "OVERLAPPING_DATES",
              listingId,
              detail: `Overlapping night dates between ${list[i].id} (${stA}) and ${list[j].id} (${stB}).`,
            });
          }
        }
      }
    }
  }

  const hasError = issues.some((i) => i.severity === "error");
  return { ok: !hasError, issues, scanned: rows.length };
}
