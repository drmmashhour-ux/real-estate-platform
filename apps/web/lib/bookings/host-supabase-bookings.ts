import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export type HostBnhubBookingRow = {
  id: string;
  listing_id: string;
  dates: unknown;
  total_price: number | string;
  status: string | null;
  guest_email: string | null;
  instructions: string | null;
  created_at: string | null;
  updated_at: string | null;
  payout_status?: string | null;
  payout_at?: string | null;
  host_estimated_payout_cents?: number | string | null;
};

const SELECT_WITH_INSTRUCTIONS =
  "id, listing_id, dates, total_price, status, guest_email, instructions, created_at, updated_at";
const SELECT_WITH_INSTRUCTIONS_AND_PAYOUT =
  "id, listing_id, dates, total_price, status, guest_email, instructions, created_at, updated_at, payout_status, payout_at, host_estimated_payout_cents";
const SELECT_BASE =
  "id, listing_id, dates, total_price, status, guest_email, created_at, updated_at";

/** Maps Supabase `bookings.status` to a payment-focused label for hosts. */
export function bnhubSupabasePaymentStatus(status: string | null | undefined): string {
  const s = (status ?? "pending").trim().toLowerCase();
  if (s === "paid" || s === "completed") return "paid";
  if (s === "processing") return "processing";
  if (s === "canceled" || s === "cancelled") return "canceled";
  return "pending";
}

export function bnhubSupabasePayoutSummaryFromRow(row: HostBnhubBookingRow): {
  payoutStatus: string;
  payoutAt: string | null;
  hostEstimatedPayoutCents: number | null;
} {
  const payment = bnhubSupabasePaymentStatus(row.status);
  const explicit = typeof row.payout_status === "string" && row.payout_status.trim() ? row.payout_status.trim() : "";
  const payoutStatus =
    explicit || (payment === "paid" ? "estimated" : payment === "canceled" ? "n/a" : "pending");
  const payoutAt = typeof row.payout_at === "string" && row.payout_at.trim() ? row.payout_at.trim() : null;
  const raw = row.host_estimated_payout_cents;
  const n = typeof raw === "number" ? raw : raw != null ? Number(raw) : NaN;
  const hostEstimatedPayoutCents = Number.isFinite(n) ? Math.round(n) : null;
  return { payoutStatus, payoutAt, hostEstimatedPayoutCents };
}

/**
 * Listing ids in Supabase where `host_user_id` matches the Supabase Auth id (JWT sub).
 */
export async function listBnhubListingIdsForHost(hostSupabaseUserId: string): Promise<string[]> {
  const id = hostSupabaseUserId.trim();
  if (!id) return [];
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return [];

  const { data, error } = await sb.from("listings").select("id").eq("host_user_id", id);
  if (error) {
    if (error.message?.toLowerCase().includes("column")) return [];
    return [];
  }
  return ((data ?? []) as { id: string }[]).map((r) => r.id).filter(Boolean);
}

async function selectBookingsForListings(
  listingIds: string[],
  mode: "full" | "no_instructions" | "base"
): Promise<{ rows: HostBnhubBookingRow[]; error: string | null }> {
  if (listingIds.length === 0) return { rows: [], error: null };
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { rows: [], error: "Booking service is not configured." };

  const trySels =
    mode === "base"
      ? [SELECT_BASE]
      : mode === "no_instructions"
        ? [SELECT_BASE]
        : [SELECT_WITH_INSTRUCTIONS_AND_PAYOUT, SELECT_WITH_INSTRUCTIONS, SELECT_BASE];

  let lastError: string | null = null;
  for (const sel of trySels) {
    const { data, error } = await sb
      .from("bookings")
      .select(sel)
      .in("listing_id", listingIds)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      lastError = error.message;
      if (error.message?.toLowerCase().includes("column")) continue;
      return { rows: [], error: error.message };
    }

    const rows = (data ?? []) as unknown as HostBnhubBookingRow[];
    if (sel === SELECT_BASE) {
      for (const r of rows) {
        r.instructions = null;
      }
    }
    return { rows, error: null };
  }

  return { rows: [], error: lastError ?? "Could not load bookings." };
}

export async function listHostBnhubBookings(hostSupabaseUserId: string): Promise<{
  ok: true;
  bookings: HostBnhubBookingRow[];
  attentionCount: number;
} | { ok: false; status: number; error: string }> {
  const listingIds = await listBnhubListingIdsForHost(hostSupabaseUserId);
  const { rows, error } = await selectBookingsForListings(listingIds, "full");
  if (error) {
    return { ok: false, status: 502, error };
  }
  const attentionCount = rows.filter((r) => {
    const s = (r.status ?? "pending").trim().toLowerCase();
    return s === "pending" || s === "processing";
  }).length;
  return { ok: true, bookings: rows, attentionCount };
}

export async function getHostBnhubBookingForHost(params: {
  bookingId: string;
  hostSupabaseUserId: string;
  isAdmin: boolean;
}): Promise<
  { ok: true; row: HostBnhubBookingRow; listingTitle: string | null } | { ok: false; status: number; error: string }
> {
  const bid = params.bookingId.trim();
  if (!bid) {
    return { ok: false, status: 400, error: "booking id is required." };
  }
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, status: 503, error: "Booking service is not configured." };
  }

  let row: HostBnhubBookingRow | null = null;
  for (const sel of [SELECT_WITH_INSTRUCTIONS_AND_PAYOUT, SELECT_WITH_INSTRUCTIONS, SELECT_BASE]) {
    const { data, error } = await sb.from("bookings").select(sel).eq("id", bid).maybeSingle();
    if (error) {
      if (!error.message?.toLowerCase().includes("column")) {
        return { ok: false, status: 502, error: error.message };
      }
      continue;
    }
    if (data) {
      row = data as unknown as HostBnhubBookingRow;
      if (sel === SELECT_BASE) row.instructions = null;
      break;
    }
  }

  if (!row) {
    return { ok: false, status: 404, error: "Booking not found." };
  }

  let listingTitle: string | null = null;
  let hostId = "";

  const l1 = await sb.from("listings").select("title, host_user_id").eq("id", row.listing_id).maybeSingle();
  if (!l1.error && l1.data) {
    const L = l1.data as { title?: string | null; host_user_id?: string | null };
    listingTitle = typeof L.title === "string" && L.title.trim() ? L.title.trim() : null;
    hostId = typeof L.host_user_id === "string" ? L.host_user_id.trim() : "";
  } else if (l1.error?.message?.toLowerCase().includes("column")) {
    const l2 = await sb.from("listings").select("title").eq("id", row.listing_id).maybeSingle();
    if (!l2.error && l2.data) {
      const L = l2.data as { title?: string | null };
      listingTitle = typeof L.title === "string" && L.title.trim() ? L.title.trim() : null;
    }
    if (!params.isAdmin) {
      return {
        ok: false,
        status: 503,
        error: "Listings are missing host_user_id — cannot verify host ownership.",
      };
    }
  }

  if (!params.isAdmin) {
    if (!hostId || hostId !== params.hostSupabaseUserId.trim()) {
      return { ok: false, status: 403, error: "You do not manage this listing." };
    }
  }

  return { ok: true, row, listingTitle };
}

export async function updateHostBnhubBookingInstructions(params: {
  bookingId: string;
  hostSupabaseUserId: string;
  isAdmin: boolean;
  instructions: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const got = await getHostBnhubBookingForHost({
    bookingId: params.bookingId,
    hostSupabaseUserId: params.hostSupabaseUserId,
    isAdmin: params.isAdmin,
  });
  if (!got.ok) return got;

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, status: 503, error: "Booking service is not configured." };
  }

  const text = params.instructions.trim();
  const { error } = await sb.from("bookings").update({ instructions: text || null }).eq("id", got.row.id);
  if (error) {
    if (error.message?.toLowerCase().includes("column")) {
      return {
        ok: false,
        status: 503,
        error: "Database is missing `bookings.instructions`. Apply supabase-bookings-host-instructions.sql.",
      };
    }
    return { ok: false, status: 502, error: error.message };
  }
  return { ok: true };
}
