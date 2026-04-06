import { logWarn } from "@/lib/logger";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { computeWeeklyRevenueBars, type WeeklyRevenueBar } from "@/lib/bookings/compute-weekly-revenue";
import {
  getHostEarningsSummaryFromSupabase,
  type HostEarningsSummary,
} from "@/lib/bookings/get-host-earnings-summary";

export type HostEarningsRecentRow = {
  id: string;
  listingTitle: string;
  total: number;
  updatedAt: string | null;
};

export type HostEarningsPayload =
  | { error: string; status: number }
  | { summary: HostEarningsSummary; recentPaid: HostEarningsRecentRow[]; weeklyRevenue: WeeklyRevenueBar[] };

/**
 * @param supabaseHostUserId — BNHub Supabase `listings.host_user_id` (same as authenticated user id when synced).
 */
export async function loadHostEarningsPayload(supabaseHostUserId: string): Promise<HostEarningsPayload> {
  const summaryResult = await getHostEarningsSummaryFromSupabase(supabaseHostUserId);
  if ("error" in summaryResult) {
    return { error: summaryResult.error, status: 503 };
  }

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { error: "Supabase is not configured.", status: 503 };
  }

  const { data: recent, error: rErr } = await sb
    .from("bookings")
    .select("id, total_price, updated_at, listing_id")
    .eq("status", "paid")
    .order("updated_at", { ascending: false })
    .limit(25);

  if (rErr) {
    logWarn("[host-earnings] recent fetch failed", { message: rErr.message });
    const weeklyRevenue = await computeWeeklyRevenueBars(sb);
    return { summary: summaryResult, recentPaid: [], weeklyRevenue };
  }

  const rows = (recent ?? []) as {
    id: string;
    total_price: number | string;
    updated_at: string | null;
    listing_id: string;
  }[];

  const listingIds = [...new Set(rows.map((r) => r.listing_id).filter(Boolean))];
  const titleByListing = new Map<string, string>();
  if (listingIds.length > 0) {
    const { data: listings } = await sb.from("listings").select("id, title").in("id", listingIds);
    for (const L of (listings ?? []) as { id: string; title: string | null }[]) {
      titleByListing.set(L.id, typeof L.title === "string" && L.title.trim() ? L.title.trim() : "Listing");
    }
  }

  const recentPaid: HostEarningsRecentRow[] = rows.map((r) => {
    const tp = typeof r.total_price === "number" ? r.total_price : Number(r.total_price);
    return {
      id: r.id,
      listingTitle: titleByListing.get(r.listing_id) ?? "Listing",
      total: Number.isFinite(tp) ? Math.round(tp * 100) / 100 : 0,
      updatedAt: r.updated_at ?? null,
    };
  });

  const weeklyRevenue = await computeWeeklyRevenueBars(sb);

  return { summary: summaryResult, recentPaid, weeklyRevenue };
}
