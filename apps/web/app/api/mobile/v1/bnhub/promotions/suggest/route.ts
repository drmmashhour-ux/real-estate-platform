import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { suggestBnhubPromotionActions } from "@/lib/monetization/promotion-suggestions";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET — AI-style promotion suggestion for a Supabase listing you host.
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

  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId")?.trim() ?? "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supaId = await getSupabaseAuthIdFromRequest(request);
  if (!supaId && appRole !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await sb
    .from("listings")
    .select("host_user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const hostId = typeof (row as { host_user_id?: string }).host_user_id === "string"
    ? (row as { host_user_id: string }).host_user_id.trim()
    : "";
  if (appRole !== "admin" && (!hostId || hostId !== supaId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestion = await suggestBnhubPromotionActions(listingId);
  return Response.json({ listingId, ...suggestion });
}
