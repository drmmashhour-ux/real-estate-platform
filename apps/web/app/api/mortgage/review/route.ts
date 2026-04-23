import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * POST public review after closed deal (token from MortgageDeal.reviewToken).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const ratingRaw = body.rating;
  const rating =
    typeof ratingRaw === "number"
      ? Math.round(ratingRaw)
      : typeof ratingRaw === "string"
        ? Math.round(Number.parseInt(ratingRaw, 10))
        : NaN;
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 4000) : "";
  const reviewerEmail = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : null;

  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }

  const deal = await prisma.mortgageDeal.findFirst({
    where: { reviewToken: token },
    include: { lead: { select: { id: true, mortgageExpertReview: true } } },
  });
  if (!deal || !deal.lead) {
    return NextResponse.json({ error: "Invalid or expired review link" }, { status: 404 });
  }
  if (deal.lead.mortgageExpertReview) {
    return NextResponse.json({ error: "Review already submitted" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.mortgageExpertReview.create({
      data: {
        expertId: deal.expertId,
        leadId: deal.leadId,
        rating,
        comment: comment || null,
        reviewerEmail,
      },
    });
    const ex = await tx.mortgageExpert.findUnique({
      where: { id: deal.expertId },
      select: { rating: true, reviewCount: true },
    });
    if (!ex) return;
    const rc = ex.reviewCount;
    const newAvg = (ex.rating * rc + rating) / (rc + 1);
    await tx.mortgageExpert.update({
      where: { id: deal.expertId },
      data: { rating: newAvg, reviewCount: { increment: 1 } },
    });
  });

  return NextResponse.json({ ok: true });
}
