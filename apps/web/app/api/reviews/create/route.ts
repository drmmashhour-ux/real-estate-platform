import { NextRequest } from "next/server";
import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { createSupabaseGuestReview } from "@/lib/reviews/create-supabase-guest-review";

/**
 * POST /api/reviews/create — BNHUB review (guest email + paid stay; optional account link via Bearer).
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const listingId =
    typeof body.listing_id === "string"
      ? body.listing_id
      : typeof body.listingId === "string"
        ? body.listingId
        : "";

  const reviewerUserId = await getSupabaseAuthIdFromRequest(req);
  const authProfile = await getMobileAuthUser(req);
  const authEmail = authProfile?.email?.trim().toLowerCase() ?? null;

  const result = await createSupabaseGuestReview({
    listingId,
    rating: body.rating,
    comment: body.comment,
    guestEmail: body.guest_email ?? body.guestEmail,
    bookingId: body.booking_id ?? body.bookingId,
    reviewerUserId,
    authEmail,
  });

  if ("createdAt" in result) {
    return Response.json({
      id: result.id,
      listingId: result.listingId,
      rating: result.rating,
      comment: result.comment,
      createdAt: result.createdAt,
    });
  }

  return Response.json(
    { error: result.error, ...(result.code ? { code: result.code } : {}) },
    { status: result.status }
  );
}

export const dynamic = "force-dynamic";
