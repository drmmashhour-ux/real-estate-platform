import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET — suggested nightly price + demand readout for a Supabase listing the caller hosts.
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
    .select("host_user_id, title, night_price_cents, city")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const L = row as {
    host_user_id?: string | null;
    title?: string | null;
    night_price_cents?: number | null;
    city?: string | null;
  };

  const hostId = typeof L.host_user_id === "string" ? L.host_user_id.trim() : "";
  if (appRole !== "admin" && (!hostId || hostId !== supaId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentCents =
    typeof L.night_price_cents === "number" && Number.isFinite(L.night_price_cents)
      ? Math.round(L.night_price_cents)
      : null;

  const demand = await prisma.bnhubListingDemandScore.findUnique({
    where: { supabaseListingId: listingId },
    select: { score: true, factorsJson: true },
  });
  const demandScore = demand?.score ?? 50;

  const suggestedDeltaPct =
    demandScore >= 75 ? 4 : demandScore <= 35 ? -6 : demandScore <= 50 ? -3 : 0;
  const suggestedNightCents =
    currentCents != null ? Math.max(50, Math.round(currentCents * (1 + suggestedDeltaPct / 100))) : null;

  return Response.json({
    listingId,
    title: typeof L.title === "string" ? L.title : null,
    city: typeof L.city === "string" ? L.city : null,
    currentNightPriceCents: currentCents,
    demandScore,
    demandFactors: demand?.factorsJson ?? null,
    suggestedNightPriceCents: suggestedNightCents,
    suggestedDeltaPct,
    note: "Heuristic suggestion only — not financial advice. Confirm comps locally.",
  });
}
