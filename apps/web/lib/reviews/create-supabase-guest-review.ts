import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { normalizeGuestBookingEmail } from "@/lib/bookings/create-guest-booking";

const MAX_COMMENT = 4000;

export type CreateGuestReviewInput = {
  listingId: string;
  rating: unknown;
  comment: unknown;
  guestEmail: unknown;
  /** When set, must match listing, guest email, and paid/completed status. */
  bookingId?: unknown;
  /** Supabase Auth user id when reviewer is signed in (server-verified). */
  reviewerUserId?: string | null;
  /** Email from verified JWT when Bearer present — used if body omits guest email (account reviews). */
  authEmail?: string | null;
};

export type CreateGuestReviewOk = {
  id: string;
  listingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type CreateGuestReviewFail = { error: string; status: number; code?: string };

function isReviewsTableMissing(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("relation") && m.includes("reviews") && m.includes("does not exist");
}

/**
 * Inserts into Supabase `public.reviews` (service role). Requires paid stay for listing + guest email.
 */
export async function createSupabaseGuestReview(input: CreateGuestReviewInput): Promise<CreateGuestReviewOk | CreateGuestReviewFail> {
  const listingId = typeof input.listingId === "string" ? input.listingId.trim() : "";
  const guestEmail =
    normalizeGuestBookingEmail(input.guestEmail) ?? normalizeGuestBookingEmail(input.authEmail);
  if (!listingId) {
    return { error: "listingId is required.", status: 400 };
  }
  if (!guestEmail) {
    return { error: "A valid guest email is required (or sign in so we can use your account email).", status: 400 };
  }

  let insertGuestEmail = guestEmail;

  const r = input.rating;
  const ratingNum = typeof r === "number" ? r : typeof r === "string" ? Number(r) : NaN;
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { error: "rating must be an integer from 1 to 5.", status: 400, code: "INVALID_RATING" };
  }

  let comment: string | null = null;
  if (input.comment != null) {
    if (typeof input.comment !== "string") {
      return { error: "comment must be a string.", status: 400 };
    }
    const t = input.comment.trim();
    if (t.length > MAX_COMMENT) {
      return { error: `comment must be at most ${MAX_COMMENT} characters.`, status: 400 };
    }
    comment = t.length > 0 ? t : null;
  }

  const bookingIdRaw =
    typeof input.bookingId === "string" ? input.bookingId.trim() : input.bookingId != null ? String(input.bookingId).trim() : "";

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { error: "Review service is not configured.", status: 503 };
  }

  const { data: listingRow, error: listErr } = await sb.from("listings").select("id").eq("id", listingId).maybeSingle();
  if (listErr) {
    if (listErr.message?.toLowerCase().includes("does not exist")) {
      return { error: "Listings data is not available.", status: 503, code: "SCHEMA_UNAVAILABLE" };
    }
    return { error: "Could not verify the listing.", status: 502 };
  }
  if (!listingRow) {
    return { error: "Listing not found.", status: 404, code: "LISTING_NOT_FOUND" };
  }

  const reviewerUid =
    typeof input.reviewerUserId === "string" && input.reviewerUserId.trim() ? input.reviewerUserId.trim() : "";

  if (bookingIdRaw) {
    const { data: b, error: bErr } = await sb
      .from("bookings")
      .select("id, listing_id, guest_email, status, user_id")
      .eq("id", bookingIdRaw)
      .maybeSingle();

    if (bErr || !b) {
      return { error: "Booking not found.", status: 404, code: "BOOKING_NOT_FOUND" };
    }
    const row = b as {
      listing_id: string;
      guest_email: string | null;
      status: string | null;
      user_id?: string | null;
    };
    if (row.listing_id !== listingId) {
      return { error: "Booking does not match this listing.", status: 400, code: "BOOKING_LISTING_MISMATCH" };
    }
    const st = (row.status ?? "").toLowerCase();
    if (st !== "paid" && st !== "completed") {
      return {
        error: "You can leave a review after a paid stay at this listing.",
        status: 403,
        code: "NO_PAID_BOOKING",
      };
    }

    const rowGuest = normalizeGuestBookingEmail(row.guest_email);
    const accountOwnsBooking =
      Boolean(reviewerUid && row.user_id && String(row.user_id) === reviewerUid);

    if (accountOwnsBooking) {
      insertGuestEmail = rowGuest ?? guestEmail;
    } else {
      if (rowGuest !== guestEmail) {
        return { error: "Guest email does not match this booking.", status: 403, code: "EMAIL_MISMATCH" };
      }
      insertGuestEmail = guestEmail;
    }
  } else {
    const { data: byEmail, error: e1 } = await sb
      .from("bookings")
      .select("id")
      .eq("listing_id", listingId)
      .eq("guest_email", guestEmail)
      .in("status", ["paid", "completed"])
      .limit(1)
      .maybeSingle();

    if (e1) {
      return { error: "Could not verify your stay.", status: 502 };
    }

    let paidOk = Boolean(byEmail);

    if (!paidOk && reviewerUid) {
      const { data: byUser, error: e2 } = await sb
        .from("bookings")
        .select("id")
        .eq("listing_id", listingId)
        .eq("user_id", reviewerUid)
        .in("status", ["paid", "completed"])
        .limit(1)
        .maybeSingle();
      if (e2) {
        return { error: "Could not verify your stay.", status: 502 };
      }
      paidOk = Boolean(byUser);
    }

    if (!paidOk) {
      return {
        error: "You can leave a review after a paid stay at this listing.",
        status: 403,
        code: "NO_PAID_BOOKING",
      };
    }
  }

  const { data: inserted, error: insErr } = await sb
    .from("reviews")
    .insert({
      listing_id: listingId,
      rating: ratingNum,
      comment,
      guest_email: insertGuestEmail,
      ...(reviewerUid ? { reviewer_user_id: reviewerUid } : {}),
    })
    .select("id, listing_id, rating, comment, created_at")
    .single();

  if (insErr) {
    if (isReviewsTableMissing(insErr.message ?? "")) {
      return {
        error: "Reviews are not set up yet. Apply the Supabase schema for reviews.",
        status: 503,
        code: "REVIEWS_UNAVAILABLE",
      };
    }
    const msg = insErr.message?.toLowerCase() ?? "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "You have already reviewed this listing.", status: 409, code: "DUPLICATE_REVIEW" };
    }
    return { error: "Could not save your review.", status: 502 };
  }

  const row = inserted as {
    id: string;
    listing_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  };
  return {
    id: row.id,
    listingId: row.listing_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
