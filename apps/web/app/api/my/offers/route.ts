import { NextRequest, NextResponse } from "next/server";
import type { OfferStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_FILTER = new Set<OfferStatus>([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
]);

/** GET /api/my/offers — current user's offers (buyer). */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const statusWhere =
    status && status !== "all" && STATUS_FILTER.has(status as OfferStatus)
      ? { status: status as OfferStatus }
      : {};

  const offers = await prisma.offer.findMany({
    where: {
      buyerId: userId,
      ...statusWhere,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, offers });
}
