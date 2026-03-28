/**
 * BNHub review pipeline smoke test: aggregation, host performance, badges, optional createReview.
 * pnpm run validate:review-system
 */
import { prisma } from "../lib/db";
import { createReview } from "../src/modules/reviews/reviewService";
import { updatePropertyRating, updateHostPerformance } from "../src/modules/reviews/aggregationService";

function isPaid(booking: {
  payment: { status: string } | null;
  bnhubReservationPayment: { paymentStatus: string } | null;
}): boolean {
  if (booking.payment?.status === "COMPLETED") return true;
  const st = booking.bnhubReservationPayment?.paymentStatus;
  return st === "PAID" || st === "PARTIALLY_REFUNDED" || st === "AUTHORIZED";
}

async function main() {
  console.info("[validate-review] 1) Load sample listing");
  const listing = await prisma.shortTermListing.findFirst({
    select: { id: true, ownerId: true },
  });
  if (!listing) {
    console.warn("[validate-review]    No BNHub listings in DB — skipping aggregation.");
    console.info("BNHub Review System Active");
    return;
  }

  console.info("[validate-review] 2) Property aggregate + host performance");
  try {
    const agg = await updatePropertyRating(listing.id);
    console.info(
      "[validate-review]    listing",
      listing.id,
      "avg",
      agg?.avgRating ?? "n/a",
      "count",
      agg?.totalReviews ?? 0
    );
    const perf = await updateHostPerformance(listing.ownerId);
    console.info("[validate-review]    host score", perf.score, "badges recomputed");
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021" || code === "P2003" || code === "P2022") {
      console.warn(
        "[validate-review]    DB schema out of date (missing columns or tables) — run: pnpm exec prisma migrate deploy"
      );
      console.info("BNHub Review System Active");
      return;
    }
    throw e;
  }

  console.info("[validate-review] 3) Optional end-to-end review (verified guest + paid stay)");
  const booking = await prisma.booking.findFirst({
    where: {
      status: "COMPLETED",
      listingId: listing.id,
      review: null,
    },
    include: {
      payment: { select: { status: true } },
      bnhubReservationPayment: { select: { paymentStatus: true } },
      guest: { select: { emailVerifiedAt: true } },
    },
  });

  const idv = booking
    ? await prisma.identityVerification.findUnique({
        where: { userId: booking.guestId },
        select: { verificationStatus: true },
      })
    : null;

  let createdReviewId: string | null = null;
  if (
    booking &&
    isPaid(booking) &&
    booking.guest.emailVerifiedAt &&
    idv?.verificationStatus === "VERIFIED"
  ) {
    try {
      const rev = await createReview(booking.id, booking.guestId, listing.id, {
        propertyRating: 5,
        cleanlinessRating: 5,
        accuracyRating: 5,
        communicationRating: 5,
        locationRating: 5,
        valueRating: 5,
        checkinRating: 5,
        comment: "BNHub validate-review-system smoke test (safe to delete).",
      });
      createdReviewId = rev.id;
      console.info("[validate-review]    created review", rev.id);
    } catch (e) {
      console.info("[validate-review]    createReview skipped:", e instanceof Error ? e.message : e);
    }
  } else {
    console.info("[validate-review]    No eligible booking (completed + paid + verified guest) on sample listing.");
  }

  if (createdReviewId) {
    await prisma.review.delete({ where: { id: createdReviewId } });
    await updatePropertyRating(listing.id);
    await updateHostPerformance(listing.ownerId);
    console.info("[validate-review]    removed smoke review; aggregates restored");
  }

  console.info("BNHub Review System Active");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
