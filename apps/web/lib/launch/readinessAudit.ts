import "server-only";

import { CACHE_KEYS, getCached } from "@/lib/cache";
import { getListingDailyCalendar } from "@/lib/booking/dailyCalendar";
import { getBookingPriceBreakdown, calculateFee } from "@/lib/booking/pricing";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { getEarlyUserCount } from "@/lib/growth/earlyUsers";
import { whereRangeBlocksListing } from "@/lib/marketplace/booking-hold";
import { runUIAudit } from "@/lib/ui/auditHeuristics";
import type { AuditItem, AuditResult } from "@/lib/launch/readinessAuditTypes";

export type { AuditItem, AuditResult } from "@/lib/launch/readinessAuditTypes";

const CRITICAL_IDS = new Set(["db_overlap", "exclusion_constraint", "booking_api_path"]);

const ITEMS_MAX_POINTS = 7 * 10; // 70 if all pass

function toScore(items: AuditItem[]): number {
  let p = 0;
  for (const it of items) {
    if (it.status === "pass") p += 10;
    else if (it.status === "warn") p += 5;
  }
  return Math.min(100, Math.round((p / ITEMS_MAX_POINTS) * 100));
}

function isCriticalPass(items: AuditItem[]): boolean {
  for (const id of CRITICAL_IDS) {
    const it = items.find((x) => x.id === id);
    if (!it || it.status !== "pass") return false;
  }
  return true;
}

/**
 * **A)** No overlapping stay rows in marketplace `bookings` (Postgres; empty table passes).
 * **B)** `no_overlap_booking` exclusion (fail if missing — re-add in migration to enforce).
 * **C)** Booking create path: listings Prisma + `whereRangeBlocksListing` + DB ping.
 * **D)** Quote math: live `getBookingPriceBreakdown` when a listing exists, else light fee sanity.
 * **E)** Calendar path: at least one day from `getListingDailyCalendar` for a short range.
 * **F)** UI heuristics from {@link runUIAudit}.
 * **G)** Early users: warn if count is 0.
 * Cached 15s (Order 73.2) to reduce read load; use `clearCache(CACHE_KEYS.launchReadiness)` in tests.
 */
async function runLaunchAuditUncached(): Promise<AuditResult> {
  const items: AuditItem[] = [];

  const db = getListingsDB();

  // A) Overlap
  try {
    const overlapRows = await db.$queryRawUnsafe<{ x?: number }[]>(`
      SELECT 1 AS x
      FROM bookings b1
      JOIN bookings b2
        ON b1.listing_id = b2.listing_id
       AND b1.id <> b2.id
       AND tsrange(b1.start_date::timestamp, b1.end_date::timestamp, '[]') &&
           tsrange(b2.start_date::timestamp, b2.end_date::timestamp, '[]')
      LIMIT 1
    `);
    if (Array.isArray(overlapRows) && overlapRows.length > 0) {
      items.push({
        id: "db_overlap",
        label: "DB overlap check (no double-booking rows)",
        status: "fail",
        details: "Found at least one overlapping stay pair for the same listing_id.",
      });
    } else {
      items.push({
        id: "db_overlap",
        label: "DB overlap check (no double-booking rows)",
        status: "pass",
        details: "No overlapping booking ranges found.",
      });
    }
  } catch (e) {
    items.push({
      id: "db_overlap",
      label: "DB overlap check (no double-booking rows)",
      status: "fail",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  // B) Exclusion constraint
  try {
    const con = await db.$queryRawUnsafe<{ conname?: string }[]>(`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'no_overlap_booking'
      LIMIT 1
    `);
    if (Array.isArray(con) && con.length > 0) {
      items.push({
        id: "exclusion_constraint",
        label: "EXCLUDE constraint (no_overlap_booking)",
        status: "pass",
        details: "Constraint present on bookings (GiST + btree_gist in migration history).",
      });
    } else {
      items.push({
        id: "exclusion_constraint",
        label: "EXCLUDE constraint (no_overlap_booking)",
        status: "fail",
        details:
          "Constraint not found (may have been dropped for expiring holds). Re-apply to enforce at DB level.",
      });
    }
  } catch (e) {
    items.push({
      id: "exclusion_constraint",
      label: "EXCLUDE constraint (no_overlap_booking)",
      status: "fail",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  // C) Booking API / create path
  try {
    if (typeof whereRangeBlocksListing !== "function") {
      throw new Error("whereRangeBlocksListing is not a function");
    }
    if (typeof db.booking?.findFirst !== "function") {
      throw new Error("listings Prisma has no booking model");
    }
    await db.$queryRaw`SELECT 1 as ok`;
    await db.booking.findFirst({ take: 1, select: { id: true } });
    items.push({
      id: "booking_api_path",
      label: "Booking create path (Prisma + conflict helpers)",
      status: "pass",
      details: "Listings client can query `bookings` and booking-hold filters load.",
    });
  } catch (e) {
    items.push({
      id: "booking_api_path",
      label: "Booking create path (Prisma + conflict helpers)",
      status: "fail",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  // D) Quote consistency (light)
  try {
    const sample = await db.listing.findFirst({ select: { id: true, price: true } });
    if (sample?.id) {
      const t = new Date();
      t.setUTCDate(t.getUTCDate() + 7);
      const t2 = new Date(t);
      t2.setUTCDate(t2.getUTCDate() + 3);
      const a = t.toISOString().slice(0, 10);
      const b = t2.toISOString().slice(0, 10);
      const br = await getBookingPriceBreakdown({ listingId: sample.id, startDate: a, endDate: b });
      if (!br || !Number.isFinite(br.total) || br.total <= 0) {
        items.push({
          id: "quote_sanity",
          label: "Quote / pricing sanity (totals, no NaN)",
          status: "fail",
          details: "getBookingPriceBreakdown returned null or non-positive total.",
        });
      } else {
        items.push({
          id: "quote_sanity",
          label: "Quote / pricing sanity (totals, no NaN)",
          status: "pass",
          details: `Sample total ${br.total} ${br.currency} (${br.nights} night(s)).`,
        });
      }
    } else {
      const sub = 200;
      const fee = calculateFee(sub);
      const t = sub + fee;
      if (!Number.isFinite(t) || t <= 0) {
        items.push({
          id: "quote_sanity",
          label: "Quote / pricing sanity (totals, no NaN)",
          status: "fail",
          details: "Fee path produced invalid number.",
        });
      } else {
        items.push({
          id: "quote_sanity",
          label: "Quote / pricing sanity (totals, no NaN)",
          status: "warn",
          details: "No listing rows; validated calculateFee() only (no live breakdown).",
        });
      }
    }
  } catch (e) {
    items.push({
      id: "quote_sanity",
      label: "Quote / pricing sanity (totals, no NaN)",
      status: "fail",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  // E) Calendar API path (internal, same as GET /api/listings/:id/calendar)
  try {
    const l = await db.listing.findFirst({ select: { id: true } });
    if (!l) {
      items.push({
        id: "calendar_api",
        label: "Calendar data (batched day rows)",
        status: "warn",
        details: "No listing to sample; skipped getListingDailyCalendar.",
      });
    } else {
      const s = new Date();
      s.setUTCDate(s.getUTCDate() + 1);
      const e = new Date(s);
      e.setUTCDate(e.getUTCDate() + 6);
      const startY = s.toISOString().slice(0, 10);
      const endY = e.toISOString().slice(0, 10);
      const days = await getListingDailyCalendar(l.id, startY, endY);
      if (days.length > 0) {
        items.push({
          id: "calendar_api",
          label: "Calendar data (batched day rows)",
          status: "pass",
          details: `Returned ${days.length} day row(s) with prices / availability fields.`,
        });
      } else {
        items.push({
          id: "calendar_api",
          label: "Calendar data (batched day rows)",
          status: "fail",
          details: "getListingDailyCalendar returned zero rows for sample range.",
        });
      }
    }
  } catch (e) {
    items.push({
      id: "calendar_api",
      label: "Calendar data (batched day rows)",
      status: "fail",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  // F) UI audit
  try {
    const ui = await runUIAudit();
    if (ui.score >= 80) {
      items.push({
        id: "ui_audit",
        label: "UI readiness (heuristic score)",
        status: "pass",
        details: `Score ${ui.score}/100 (≥ 80).`,
      });
    } else if (ui.score >= 50) {
      items.push({
        id: "ui_audit",
        label: "UI readiness (heuristic score)",
        status: "warn",
        details: `Score ${ui.score}/100 (target ≥ 80).`,
      });
    } else {
      items.push({
        id: "ui_audit",
        label: "UI readiness (heuristic score)",
        status: "fail",
        details: `Score ${ui.score}/100 (target ≥ 80).`,
      });
    }
  } catch (e) {
    items.push({
      id: "ui_audit",
      label: "UI readiness (heuristic score)",
      status: "fail",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  // G) Early users
  try {
    const n = await getEarlyUserCount();
    if (n > 0) {
      items.push({
        id: "early_users",
        label: "Early user cohort (EarlyUser count)",
        status: "pass",
        details: `Count: ${n}.`,
      });
    } else {
      items.push({
        id: "early_users",
        label: "Early user cohort (EarlyUser count)",
        status: "warn",
        details: "Zero early users recorded — traction gate may block launch elsewhere.",
      });
    }
  } catch (e) {
    items.push({
      id: "early_users",
      label: "Early user cohort (EarlyUser count)",
      status: "warn",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  return {
    score: toScore(items),
    criticalPass: isCriticalPass(items),
    items,
  };
}

export async function runLaunchAudit(): Promise<AuditResult> {
  return getCached(CACHE_KEYS.launchReadiness, 15, runLaunchAuditUncached);
}
