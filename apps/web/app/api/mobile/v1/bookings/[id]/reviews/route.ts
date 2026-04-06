import { createReview, type CreateBnhubReviewInput } from "@/src/modules/reviews/reviewService";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";
import { logApiRouteError } from "@/lib/api/dev-log";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const { id: bookingId } = await params;
    const raw = (await request.json().catch(() => ({}))) as CreateBnhubReviewInput & { listingId?: string };
    const listingId = typeof raw.listingId === "string" ? raw.listingId.trim() : "";
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    const { listingId: _drop, ...data } = raw;
    const review = await createReview(bookingId, user.id, listingId, data, {
      skipIdentityVerification: true,
    });
    return Response.json({ review: { id: review.id } });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const msg = e instanceof Error ? e.message : "Review failed";
    const status =
      msg.includes("Not your booking") || msg.includes("not found") ? 404 : msg.includes("Already reviewed") ? 409 : 400;
    if (status === 400) logApiRouteError("POST /api/mobile/v1/bookings/[id]/reviews", e);
    return Response.json({ error: msg }, { status });
  }
}
