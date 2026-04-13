import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  listing_id: string;
  dates: unknown;
  total_price: number | string;
  status: string | null;
  guest_email: string | null;
  updated_at: string | null;
};

function rowToDto(
  b: BookingRow,
  listingMeta: Map<string, { title: string | null; city: string | null }>
) {
  const total =
    typeof b.total_price === "number" ? b.total_price : Number(b.total_price);
  const meta = listingMeta.get(b.listing_id);
  return {
    id: b.id,
    listingId: b.listing_id,
    dates: b.dates,
    total: Number.isFinite(total) ? total : 0,
    status: b.status ?? "unknown",
    guestEmail: b.guest_email,
    updatedAt: b.updated_at,
    listingTitle: meta?.title ?? null,
    listingCity: meta?.city ?? null,
  };
}

function mergeById(rows: BookingRow[]): BookingRow[] {
  const m = new Map<string, BookingRow>();
  for (const r of rows) {
    if (!m.has(r.id)) m.set(r.id, r);
  }
  return Array.from(m.values()).sort((a, b) => {
    const ta = a.updated_at ? Date.parse(a.updated_at) : 0;
    const tb = b.updated_at ? Date.parse(b.updated_at) : 0;
    return tb - ta;
  });
}

/**
 * GET /api/mobile/v1/bnhub/my-bookings
 * BNHUB Supabase bookings: `user_id` = JWT sub, plus legacy guest rows with matching `guest_email` and null `user_id`.
 */
export async function GET(request: Request) {
  const authUser = await getMobileAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supaId = await getSupabaseAuthIdFromRequest(request);
  if (!supaId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return Response.json({ error: "Booking service is not configured." }, { status: 503 });
  }

  const select = "id, listing_id, dates, total_price, status, guest_email, updated_at";

  const { data: owned, error: e1 } = await sb
    .from("bookings")
    .select(select)
    .eq("user_id", supaId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (e1) {
    return Response.json({ error: e1.message }, { status: 502 });
  }

  const email = (authUser.email ?? "").trim().toLowerCase();
  let guestLegacy: BookingRow[] = [];
  if (email) {
    const { data: g, error: e2 } = await sb
      .from("bookings")
      .select(select)
      .eq("guest_email", email)
      .is("user_id", null)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!e2 && g) guestLegacy = g as BookingRow[];
  }

  const merged = mergeById([...((owned ?? []) as BookingRow[]), ...guestLegacy]).slice(0, 50);

  const listingIds = [...new Set(merged.map((r) => r.listing_id))];
  const listingMeta = new Map<string, { title: string | null; city: string | null }>();
  if (listingIds.length > 0) {
    const { data: lists, error: le } = await sb
      .from("listings")
      .select("id, title, city")
      .in("id", listingIds);
    if (!le && lists) {
      for (const row of lists as { id: string; title: string | null; city: string | null }[]) {
        listingMeta.set(row.id, { title: row.title, city: row.city });
      }
    }
  }

  return Response.json({
    bookings: merged.map((b) => rowToDto(b, listingMeta)),
  });
}
