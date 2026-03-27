import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { refreshBrokerRatingAggregates } from "@/modules/mortgage/services/broker-performance";

export const dynamic = "force-dynamic";

/** POST { mortgageRequestId, rating: 1–5, comment?: string } — client review after broker engagement. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { mortgageRequestId?: unknown; rating?: unknown; comment?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mortgageRequestId =
    typeof body.mortgageRequestId === "string" ? body.mortgageRequestId.trim() : "";
  const ratingRaw = body.rating;
  const rating = typeof ratingRaw === "number" ? Math.floor(ratingRaw) : Number(ratingRaw);
  const comment =
    typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : undefined;

  if (!mortgageRequestId) {
    return NextResponse.json({ error: "mortgageRequestId required" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  const row = await prisma.mortgageRequest.findFirst({
    where: { id: mortgageRequestId, userId },
    select: { id: true, brokerId: true, status: true },
  });
  if (!row?.brokerId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const status = row.status.toLowerCase();
  if (status !== "contacted" && status !== "approved") {
    return NextResponse.json(
      { error: "You can review after your broker has contacted you or approved the request." },
      { status: 400 }
    );
  }

  const existing = await prisma.brokerReview.findUnique({
    where: { mortgageRequestId: row.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "You already submitted a review for this request." }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.brokerReview.create({
      data: {
        brokerId: row.brokerId!,
        mortgageRequestId: row.id,
        userId,
        rating,
        comment: comment || null,
      },
    });
  });

  await refreshBrokerRatingAggregates(row.brokerId);

  return NextResponse.json({ ok: true });
}
