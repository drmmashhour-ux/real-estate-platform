import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { engineFlags } from "@/config/feature-flags";
import { isReasonableListingId } from "@/lib/api/safe-params";

export const dynamic = "force-dynamic";

function maskSessionId(s: string | null | undefined): string | null {
  if (!s || s.length < 12) return s ?? null;
  return `${s.slice(0, 8)}…`;
}

/**
 * GET /api/featured/status/[listingId] — FSBO owner: featured window + latest row (masked Stripe refs).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId: raw } = await context.params;
  const listingId = raw?.trim() ?? "";
  if (!isReasonableListingId(listingId)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, featuredUntil: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.featuredListing.findFirst({
    where: { listingKind: "fsbo", listingId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      startAt: true,
      endAt: true,
      source: true,
      stripeCheckoutSessionId: true,
      createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    flags: { featuredListingsV1: engineFlags.featuredListingsV1 },
    featuredUntil: listing.featuredUntil?.toISOString() ?? null,
    latest: row
      ? {
          id: row.id,
          status: row.status,
          startAt: row.startAt.toISOString(),
          endAt: row.endAt.toISOString(),
          source: row.source,
          createdAt: row.createdAt.toISOString(),
          checkoutSessionRef: maskSessionId(row.stripeCheckoutSessionId),
        }
      : null,
  });
}
