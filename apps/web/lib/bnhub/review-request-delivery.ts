import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

/**
 * In-app notification + optional email when a stay completes (review request).
 * De-duplicates per booking within 48h.
 */
export async function deliverBnhubReviewRequest(payload: {
  bookingId: string;
  guestId: string;
  listingId: string;
}): Promise<void> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      userId: payload.guestId,
      type: "REMINDER",
      createdAt: { gte: since },
      metadata: {
        equals: { bookingId: payload.bookingId, kind: "bnhub_review_request" },
      },
    },
  });
  if (existing) return;

  const [guest, listing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.guestId },
      select: { email: true, name: true },
    }),
    prisma.shortTermListing.findUnique({
      where: { id: payload.listingId },
      select: { title: true },
    }),
  ]);

  await prisma.notification.create({
    data: {
      userId: payload.guestId,
      type: "REMINDER",
      title: "How was your stay?",
      message: listing?.title
        ? `Share a quick review for “${listing.title}” to help future guests.`
        : "Your trip is complete — leave a short review.",
      listingId: payload.listingId,
      actionUrl: `/bnhub/listings/${payload.listingId}`,
      actionLabel: "Leave a review",
      metadata: { bookingId: payload.bookingId, kind: "bnhub_review_request" },
    },
  });

  if (guest?.email) {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const link = `${base}/bnhub/listings/${payload.listingId}`;
    await sendEmail({
      to: guest.email,
      subject: "How was your BNHub stay?",
      html: `<p>Hi ${guest.name ?? "there"},</p><p>Your stay is complete. <a href="${link}">Leave a review</a> when you have a moment.</p>`,
    });
  }
}
