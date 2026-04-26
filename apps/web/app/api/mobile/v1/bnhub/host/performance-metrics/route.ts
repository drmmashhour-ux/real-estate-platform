import { BnhubBookingFunnelStage } from "@prisma/client";
import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { listBnhubListingIdsForHost } from "@/lib/bookings/host-supabase-bookings";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * GET — host-facing funnel metrics for Supabase listings (views, clicks, paid funnel events).
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
  if (!supaId && appRole !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingIds =
    appRole === "admin" && !supaId
      ? []
      : await listBnhubListingIdsForHost(supaId ?? "");

  if (listingIds.length === 0) {
    return Response.json({
      listingCount: 0,
      views7d: 0,
      clicks7d: 0,
      funnelStarted30d: 0,
      funnelCheckout30d: 0,
      funnelPaid30d: 0,
      note: "No Supabase listings linked to this host id.",
    });
  }

  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000);
  const d30 = new Date(now - 30 * 86400000);

  const [views7d, clicks7d, started, checkout, paid] = await Promise.all([
    prisma.bnhubClientListingViewEvent.count({
      where: { supabaseListingId: { in: listingIds }, createdAt: { gte: d7 } },
    }),
    prisma.bnhubClientClickEvent.count({
      where: { supabaseListingId: { in: listingIds }, createdAt: { gte: d7 } },
    }),
    prisma.bnhubClientBookingFunnelEvent.count({
      where: {
        supabaseListingId: { in: listingIds },
        stage: BnhubBookingFunnelStage.STARTED,
        createdAt: { gte: d30 },
      },
    }),
    prisma.bnhubClientBookingFunnelEvent.count({
      where: {
        supabaseListingId: { in: listingIds },
        stage: BnhubBookingFunnelStage.CHECKOUT,
        createdAt: { gte: d30 },
      },
    }),
    prisma.bnhubClientBookingFunnelEvent.count({
      where: {
        supabaseListingId: { in: listingIds },
        stage: BnhubBookingFunnelStage.PAID,
        createdAt: { gte: d30 },
      },
    }),
  ]);

  return Response.json({
    listingCount: listingIds.length,
    views7d,
    clicks7d,
    funnelStarted30d: started,
    funnelCheckout30d: checkout,
    funnelPaid30d: paid,
    windows: { engagementDays: 7, funnelDays: 30 },
  });
}
