import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import {
  bnhubSupabasePaymentStatus,
  bnhubSupabasePayoutSummaryFromRow,
  getHostBnhubBookingForHost,
} from "@/lib/bookings/host-supabase-bookings";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params;
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

  const result = await getHostBnhubBookingForHost({
    bookingId: bookingId ?? "",
    hostSupabaseUserId: supaId,
    isAdmin: appRole === "admin",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const b = result.row;
  const total = typeof b.total_price === "number" ? b.total_price : Number(b.total_price);
  const payout = bnhubSupabasePayoutSummaryFromRow(b);

  return Response.json({
    booking: {
      id: b.id,
      listingId: b.listing_id,
      listingTitle: result.listingTitle,
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
    },
  });
}
