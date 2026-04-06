import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export type AdminBookingMetrics = {
  totalBookings: number;
  paidBookings: number;
  pendingBookings: number;
  processingBookings: number;
  grossRevenuePaid: number;
};

export async function loadAdminBookingMetrics(): Promise<AdminBookingMetrics | { error: string }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { error: "Supabase is not configured." };
  }

  const { count: totalBookings, error: tErr } = await sb
    .from("bookings")
    .select("id", { count: "exact", head: true });
  if (tErr) {
    return { error: tErr.message };
  }

  const { count: paidBookings, error: pErr } = await sb
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "paid");
  if (pErr) {
    return { error: pErr.message };
  }

  const { count: pendingBookings, error: penErr } = await sb
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (penErr) {
    return { error: penErr.message };
  }

  const { count: processingBookings, error: procErr } = await sb
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "processing");
  if (procErr) {
    return { error: procErr.message };
  }

  const { data: paidRows, error: sumErr } = await sb
    .from("bookings")
    .select("total_price")
    .eq("status", "paid");
  if (sumErr) {
    return { error: sumErr.message };
  }

  let grossRevenuePaid = 0;
  for (const r of (paidRows ?? []) as { total_price: number | string }[]) {
    const n = typeof r.total_price === "number" ? r.total_price : Number(r.total_price);
    if (Number.isFinite(n)) grossRevenuePaid += n;
  }
  grossRevenuePaid = Math.round(grossRevenuePaid * 100) / 100;

  return {
    totalBookings: totalBookings ?? 0,
    paidBookings: paidBookings ?? 0,
    pendingBookings: pendingBookings ?? 0,
    processingBookings: processingBookings ?? 0,
    grossRevenuePaid,
  };
}
