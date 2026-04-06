import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import {
  bnhubSupabasePaymentStatus,
  bnhubSupabasePayoutSummaryFromRow,
  listHostBnhubBookings,
  type HostBnhubBookingRow,
} from "@/lib/bookings/host-supabase-bookings";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

function rowToDto(b: HostBnhubBookingRow) {
  const total = typeof b.total_price === "number" ? b.total_price : Number(b.total_price);
  const payout = bnhubSupabasePayoutSummaryFromRow(b);
  return {
    id: b.id,
    listingId: b.listing_id,
    dates: b.dates,
    total: Number.isFinite(total) ? total : 0,
    status: (b.status ?? "pending").trim() || "pending",
    paymentStatus: bnhubSupabasePaymentStatus(b.status),
    payoutStatus: payout.payoutStatus,
    payoutAt: payout.payoutAt,
    hostEstimatedPayoutCents: payout.hostEstimatedPayoutCents,
    guestEmail: b.guest_email,
    instructions: b.instructions,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

/**
 * GET /api/mobile/v1/bnhub/host/bookings
 * BNHub Supabase bookings for listings owned by the host (`listings.host_user_id` = JWT sub).
 */
export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appRole = await resolveMobileAppRoleFromRequest(request, user);
  if (appRole !== "host" && appRole !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supaId = await getSupabaseAuthIdFromRequest(request);
  if (!supaId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listHostBnhubBookings(supaId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    bookings: result.bookings.map(rowToDto),
    attentionCount: result.attentionCount,
  });
}
