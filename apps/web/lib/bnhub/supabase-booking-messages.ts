import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export type SupabaseBookingMessageRow = {
  id: string;
  booking_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

function isMissingRelationError(message: string) {
  return message.toLowerCase().includes("relation") && message.toLowerCase().includes("does not exist");
}

export async function resolveSupabaseBookingMessagingRole(params: {
  bookingId: string;
  supabaseUserId: string | null;
  guestEmailLower: string | null;
}): Promise<
  | { ok: true; role: "host" | "guest"; hostUserId: string; listingTitle: string | null }
  | { ok: false; status: number; error: string }
> {
  const bid = params.bookingId.trim();
  if (!bid) return { ok: false, status: 400, error: "booking id required" };

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { ok: false, status: 503, error: "Booking service is not configured." };

  const { data: booking, error: bErr } = await sb
    .from("bookings")
    .select("id, listing_id, guest_email, user_id")
    .eq("id", bid)
    .maybeSingle();

  if (bErr) return { ok: false, status: 502, error: bErr.message };
  if (!booking) return { ok: false, status: 404, error: "Booking not found." };

  const row = booking as {
    listing_id: string;
    guest_email?: string | null;
    user_id?: string | null;
  };

  const { data: listing, error: lErr } = await sb
    .from("listings")
    .select("title, host_user_id")
    .eq("id", row.listing_id)
    .maybeSingle();

  if (lErr && !lErr.message?.toLowerCase().includes("column")) {
    return { ok: false, status: 502, error: lErr.message };
  }

  const L = (listing ?? {}) as { title?: string | null; host_user_id?: string | null };
  const listingTitle = typeof L.title === "string" && L.title.trim() ? L.title.trim() : null;
  const hostUserId = typeof L.host_user_id === "string" ? L.host_user_id.trim() : "";
  if (!hostUserId) {
    return { ok: false, status: 503, error: "Listing has no host_user_id." };
  }

  const supa = params.supabaseUserId?.trim() ?? "";
  const email = (params.guestEmailLower ?? "").trim().toLowerCase();
  const guestMail = typeof row.guest_email === "string" ? row.guest_email.trim().toLowerCase() : "";
  const bookingUserId = typeof row.user_id === "string" ? row.user_id.trim() : "";

  if (supa && supa === hostUserId) {
    return { ok: true, role: "host", hostUserId, listingTitle };
  }
  if (supa && bookingUserId && supa === bookingUserId) {
    return { ok: true, role: "guest", hostUserId, listingTitle };
  }
  if (email && guestMail && email === guestMail) {
    return { ok: true, role: "guest", hostUserId, listingTitle };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}

export async function listSupabaseBookingMessages(bookingId: string): Promise<
  { ok: true; messages: SupabaseBookingMessageRow[] } | { ok: false; error: string }
> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { ok: false, error: "supabase not configured" };

  const { data, error } = await sb
    .from("booking_messages")
    .select("id, booking_id, sender_user_id, body, created_at")
    .eq("booking_id", bookingId.trim())
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    if (isMissingRelationError(error.message)) return { ok: true, messages: [] };
    return { ok: false, error: error.message };
  }
  return { ok: true, messages: (data ?? []) as SupabaseBookingMessageRow[] };
}

export async function insertSupabaseBookingMessage(params: {
  bookingId: string;
  senderUserId: string;
  body: string;
}): Promise<{ ok: true; row: SupabaseBookingMessageRow } | { ok: false; error: string }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { ok: false, error: "supabase not configured" };

  const body = params.body.trim().slice(0, 8000);
  if (!body) return { ok: false, error: "body required" };

  const { data, error } = await sb
    .from("booking_messages")
    .insert({
      booking_id: params.bookingId.trim(),
      sender_user_id: params.senderUserId.trim(),
      body,
    })
    .select("id, booking_id, sender_user_id, body, created_at")
    .single();

  if (error) {
    if (isMissingRelationError(error.message)) {
      return { ok: false, error: "booking_messages table missing — run supabase-bnhub-host-experience.sql" };
    }
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "insert failed" };
  return { ok: true, row: data as SupabaseBookingMessageRow };
}
