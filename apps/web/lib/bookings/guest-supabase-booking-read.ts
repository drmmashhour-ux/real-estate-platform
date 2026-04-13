import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { isGuestBookingPaidOrCompleted } from "@/lib/bookings/guest-booking-status";

export type GuestBookingSnapshot = {
  id: string;
  listingId: string;
  dates: unknown;
  totalPrice: number;
  status: string;
  guestEmail: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  listingTitle: string | null;
  /** Host-written notes; only populated after payment (see server). */
  instructions: string | null;
  /** From listing; only after payment. */
  checkInInstructions: string | null;
  /** From listing `access_type`; only after payment. */
  accessType: string | null;
};

/**
 * BNHUB Supabase `bookings` row + listing title (service role). Used by guest mobile via platform API — not direct anon DB reads.
 */
export async function fetchGuestSupabaseBookingSnapshot(
  bookingId: string
): Promise<{ ok: true; booking: GuestBookingSnapshot } | { ok: false; status: number; error: string }> {
  const id = bookingId.trim();
  if (!id) {
    return { ok: false, status: 400, error: "booking id is required." };
  }
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, status: 503, error: "Booking service is not configured." };
  }

  let row: Record<string, unknown> | null = null;
  let bErr: { message: string } | null = null;
  const selFull =
    "id, listing_id, dates, total_price, status, guest_email, stripe_checkout_session_id, stripe_payment_intent_id, created_at, updated_at, instructions";
  const selBase =
    "id, listing_id, dates, total_price, status, guest_email, stripe_checkout_session_id, stripe_payment_intent_id, created_at, updated_at";

  for (const sel of [selFull, selBase]) {
    const r = await sb.from("bookings").select(sel).eq("id", id).maybeSingle();
    if (!r.error && r.data) {
      row = r.data as unknown as Record<string, unknown>;
      break;
    }
    bErr = r.error;
    if (r.error && !r.error.message?.toLowerCase().includes("column")) {
      return { ok: false, status: 502, error: r.error.message };
    }
  }

  if (bErr && !row) {
    return { ok: false, status: 502, error: bErr.message };
  }
  if (!row) {
    return { ok: false, status: 404, error: "Booking not found." };
  }

  const r = row as {
    id: string;
    listing_id: string;
    dates: unknown;
    total_price: number | string;
    status: string | null;
    guest_email: string | null;
    stripe_checkout_session_id: string | null;
    stripe_payment_intent_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    instructions?: string | null;
  };

  let listingTitle: string | null = null;
  let checkInInstructions: string | null = null;
  let accessType: string | null = null;

  const selListingFull = "title, check_in_instructions, access_type";
  const selListingTitle = "title";
  for (const lsel of [selListingFull, selListingTitle]) {
    const lr = await sb.from("listings").select(lsel).eq("id", r.listing_id).maybeSingle();
    if (lr.error?.message?.toLowerCase().includes("column")) continue;
    if (lr.error) {
      return { ok: false, status: 502, error: lr.error.message };
    }
    if (lr.data) {
      const L = lr.data as {
        title?: string | null;
        check_in_instructions?: string | null;
        access_type?: string | null;
      };
      if (typeof L.title === "string") listingTitle = L.title.trim() || null;
      if (typeof L.check_in_instructions === "string" && L.check_in_instructions.trim()) {
        checkInInstructions = L.check_in_instructions.trim();
      }
      if (typeof L.access_type === "string" && L.access_type.trim()) {
        accessType = L.access_type.trim();
      }
      break;
    }
  }

  const totalNum = typeof r.total_price === "number" ? r.total_price : Number(r.total_price);
  const statusNorm = (r.status ?? "pending").trim() || "pending";
  const rawInstructions = typeof r.instructions === "string" && r.instructions.trim() ? r.instructions.trim() : null;
  const paid = isGuestBookingPaidOrCompleted(statusNorm);
  const instructions = paid ? rawInstructions : null;

  return {
    ok: true,
    booking: {
      id: r.id,
      listingId: r.listing_id,
      dates: r.dates,
      totalPrice: Number.isFinite(totalNum) ? totalNum : 0,
      status: statusNorm,
      guestEmail: r.guest_email,
      stripeCheckoutSessionId: r.stripe_checkout_session_id,
      stripePaymentIntentId: r.stripe_payment_intent_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      listingTitle,
      instructions,
      checkInInstructions: paid ? checkInInstructions : null,
      accessType: paid ? accessType : null,
    },
  };
}

/** Lightweight poll target after Stripe — status column only. */
export async function fetchGuestSupabaseBookingStatusOnly(
  bookingId: string
): Promise<{ ok: true; status: string } | { ok: false; status: number; error: string }> {
  const id = bookingId.trim();
  if (!id) {
    return { ok: false, status: 400, error: "booking id is required." };
  }
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, status: 503, error: "Booking service is not configured." };
  }
  const { data, error } = await sb.from("bookings").select("status").eq("id", id).maybeSingle();
  if (error) {
    return { ok: false, status: 502, error: error.message };
  }
  if (!data) {
    return { ok: false, status: 404, error: "Booking not found." };
  }
  const st = typeof (data as { status?: string }).status === "string" ? (data as { status: string }).status : "pending";
  return { ok: true, status: st.trim() || "pending" };
}
