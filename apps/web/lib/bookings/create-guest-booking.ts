import type { NextRequest } from "next/server";
import { logInfo, logWarn } from "@/lib/logger";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { normalizeConsecutiveSelectedNights } from "@/lib/bookings/guest-booking-availability";
import {
  assertGuestIdentityAllowedForBooking,
  GuestIdentityRequiredError,
} from "@/lib/bnhub/guest-identity-gate";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { resolvePrismaIdentitySubjectUserId } from "@/lib/mobile/resolvePrismaIdentitySubjectUserId";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeGuestBookingEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (s.length < 4 || s.length > 319 || !EMAIL_RE.test(s)) return null;
  return s;
}

export type CreateGuestBookingInput = {
  listingId: string;
  selectedDates: unknown;
  guestEmail: unknown;
  /** Supabase Auth user id when `Authorization: Bearer` present on the API route (server-verified). */
  supabaseUserId?: string | null;
  /** Optional — used to resolve Prisma guest for identity gate when signed in. */
  request?: NextRequest | Request;
};

export type CreateGuestBookingSuccess = {
  bookingId: string;
  total: number;
  nights: number;
  title: string;
};

export type CreateGuestBookingFailure = { error: string; status: number; code?: string };

type RpcRow = {
  booking_id: string;
  out_title: string;
  out_total: number | string;
  out_nights: number;
};

function mapRpcExceptionMessage(msg: string): CreateGuestBookingFailure | null {
  const m = msg.toLowerCase();
  if (m.includes("dates_unavailable")) {
    return {
      error: "Those dates are no longer available for this listing. Please choose different nights.",
      status: 409,
      code: "DATES_UNAVAILABLE",
    };
  }
  if (m.includes("listing_not_found")) {
    return { error: "Listing not found.", status: 404, code: "LISTING_NOT_FOUND" };
  }
  if (
    m.includes("invalid_guest_email") ||
    m.includes("invalid_dates") ||
    m.includes("empty_dates") ||
    m.includes("invalid_date_format") ||
    m.includes("dates_not_consecutive")
  ) {
    return { error: "Invalid dates or email. Check your selection and try again.", status: 400 };
  }
  if (m.includes("invalid_listing_price")) {
    return { error: "Listing has no valid nightly price.", status: 400 };
  }
  return null;
}

function isRpcMissingError(message: string | undefined, code: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    (m.includes("create_guest_booking") && (m.includes("does not exist") || m.includes("unknown function"))) ||
    code === "42883"
  );
}

const RPC_REQUIRED_MSG = "Booking RPC is not deployed.";

/**
 * **Only** `public.create_guest_booking` — single transaction + listing lock.
 * Apply `apps/mobile/docs/supabase-rpc-create-guest-booking.sql`; legacy app-layer insert is removed.
 */
export async function createGuestBookingInSupabase(
  input: CreateGuestBookingInput
): Promise<CreateGuestBookingSuccess | CreateGuestBookingFailure> {
  const listingId = input.listingId.trim();
  const guestEmail = normalizeGuestBookingEmail(input.guestEmail);
  if (!listingId) {
    return { error: "listingId is required.", status: 400 };
  }
  if (!guestEmail) {
    return { error: "A valid guest email is required.", status: 400 };
  }

  const nightsParsed = normalizeConsecutiveSelectedNights(input.selectedDates);
  if (!nightsParsed.ok) {
    return { error: nightsParsed.error, status: 400 };
  }
  const nights = nightsParsed.nights;

  const linkedUser = typeof input.supabaseUserId === "string" && input.supabaseUserId.trim() ? input.supabaseUserId.trim() : null;

  logInfo("[create-guest-booking] request started", {
    listingId,
    nightCount: nights.length,
    guestEmailDomain: guestEmail.includes("@") ? guestEmail.split("@")[1] : undefined,
    accountLinked: Boolean(linkedUser),
  });

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    logWarn("[create-guest-booking] supabase service client unavailable");
    return { error: "Booking service is not configured on the server.", status: 503 };
  }

  const { data: priceRow } = await sb.from("listings").select("price_per_night").eq("id", listingId).maybeSingle();
  const priceNum = Number((priceRow as { price_per_night?: unknown } | null)?.price_per_night);
  const estimatedUsd =
    Number.isFinite(priceNum) && priceNum >= 0 ? Math.round(priceNum * nights.length * 100) / 100 : 0;

  let prismaGuestId: string | null = null;
  if (input.request) {
    const mobileUser = await getMobileAuthUser(input.request);
    if (mobileUser) {
      prismaGuestId = await resolvePrismaIdentitySubjectUserId(mobileUser);
    }
  }

  try {
    await assertGuestIdentityAllowedForBooking({
      prismaListingId: listingId,
      guestTotalUsd: estimatedUsd,
      prismaGuestUserId: prismaGuestId,
    });
  } catch (e) {
    if (e instanceof GuestIdentityRequiredError) {
      return { error: e.message, status: 403, code: e.code };
    }
    throw e;
  }

  const { data: rpcData, error: rpcErr } = await sb.rpc("create_guest_booking", {
    p_listing_id: listingId,
    p_selected_dates: nights,
    p_guest_email: guestEmail,
    p_user_id: linkedUser,
  });

  if (!rpcErr && rpcData != null) {
    const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as RpcRow | undefined;
    if (
      row &&
      typeof row.booking_id === "string" &&
      typeof row.out_title === "string" &&
      (typeof row.out_total === "number" || typeof row.out_total === "string") &&
      typeof row.out_nights === "number"
    ) {
      const totalNum = typeof row.out_total === "number" ? row.out_total : Number(row.out_total);
      const total = Number.isFinite(totalNum) ? totalNum : 0;
      logInfo("[create-guest-booking] booking created successfully", {
        bookingId: row.booking_id,
        listingId,
        nights: row.out_nights,
        total,
        title: row.out_title,
      });
      return {
        bookingId: row.booking_id,
        title: row.out_title,
        total,
        nights: row.out_nights,
      };
    }
  }

  if (rpcErr) {
    const mapped = mapRpcExceptionMessage(rpcErr.message ?? "");
    if (mapped) {
      if (mapped.code === "DATES_UNAVAILABLE") {
        logWarn("[create-guest-booking] overlap conflict", { listingId, code: "DATES_UNAVAILABLE" });
      } else if (mapped.code === "LISTING_NOT_FOUND") {
        logWarn("[create-guest-booking] listing not found (RPC)", { listingId });
      }
      return mapped;
    }
    if (isRpcMissingError(rpcErr.message, rpcErr.code)) {
      logWarn("[create-guest-booking] RPC unavailable — function missing", {
        code: rpcErr.code,
        message: rpcErr.message,
      });
      return {
        error: RPC_REQUIRED_MSG,
        status: 503,
        code: "RPC_REQUIRED",
      };
    }
    logWarn("[create-guest-booking] rpc error", { message: rpcErr.message, code: rpcErr.code });
    return {
      error: "Could not complete booking. Please try again in a moment.",
      status: 502,
    };
  }

  logWarn("[create-guest-booking] RPC unavailable — empty response", { listingId });
  return {
    error: RPC_REQUIRED_MSG,
    status: 503,
    code: "RPC_REQUIRED",
  };
}
