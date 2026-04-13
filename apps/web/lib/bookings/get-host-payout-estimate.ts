import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

/**
 * Gross paid booking volume attributable to a BNHUB Supabase host (`listings.host_user_id`).
 * Automated Stripe transfers to Connect are not run here — this is reporting groundwork only.
 */
export type HostPayoutEstimate = {
  grossPaid: number;
  paidBookingCount: number;
  listingCount: number;
  /** Customer charges still go through existing Checkout; Connect destination splits are a future step. */
  note: string;
};

export async function estimateHostPayoutableFromSupabase(
  supabaseHostUserId: string
): Promise<HostPayoutEstimate | { error: string }> {
  const id = supabaseHostUserId.trim();
  if (!id) {
    return { error: "host id required" };
  }
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { error: "Supabase service is not configured." };
  }

  const { data: listings, error: lErr } = await sb.from("listings").select("id").eq("host_user_id", id);
  if (lErr) {
    return { error: lErr.message };
  }
  const listingIds = (listings ?? []).map((r: { id: string }) => r.id);
  if (listingIds.length === 0) {
    return {
      grossPaid: 0,
      paidBookingCount: 0,
      listingCount: 0,
      note: "No listings linked to this host id yet.",
    };
  }

  const { data: bookings, error: bErr } = await sb
    .from("bookings")
    .select("total_price")
    .in("listing_id", listingIds)
    .eq("status", "paid");

  if (bErr) {
    return { error: bErr.message };
  }

  const rows = (bookings ?? []) as { total_price: number | string }[];
  let gross = 0;
  for (const r of rows) {
    const p = typeof r.total_price === "number" ? r.total_price : Number(r.total_price);
    if (Number.isFinite(p)) gross += p;
  }

  return {
    grossPaid: Math.round(gross * 100) / 100,
    paidBookingCount: rows.length,
    listingCount: listingIds.length,
    note:
      "Gross is sum of paid guest bookings for your listings. Platform fees and Connect transfers apply when checkout is wired for split payouts.",
  };
}
