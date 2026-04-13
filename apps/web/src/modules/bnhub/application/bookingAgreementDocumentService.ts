import { prisma } from "@/lib/db";

/**
 * Builds a human-readable booking agreement and stores `bnhub_booking_agreements` (documentUrl optional).
 */
export async function generateBookingAgreement(bookingId: string, options?: { documentUrl?: string | null }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
    },
  });
  if (!booking) throw new Error("Booking not found");

  const l = booking.listing;
  const nights = booking.nights;
  const subtotal = booking.totalCents;
  const guestFee = booking.guestFeeCents;
  const total = booking.payment?.amountCents ?? subtotal + guestFee;

  const lines = [
    `# BNHUB reservation agreement`,
    ``,
    `**Property:** ${l.title}`,
    `**Address:** ${l.address}, ${l.city}, ${l.country}`,
    `**Guest:** ${booking.guest.name ?? booking.guest.email}`,
    `**Check-in:** ${booking.checkIn.toISOString().slice(0, 10)}`,
    `**Check-out:** ${booking.checkOut.toISOString().slice(0, 10)}`,
    `**Nights:** ${nights}`,
    ``,
    `## Pricing (cents)`,
    `- Lodging subtotal: ${subtotal}`,
    `- Guest service fee: ${guestFee}`,
    `- **Total charged:** ${total}`,
    ``,
    `## Deposit & fees`,
    `- Security deposit (listing): ${l.securityDepositCents} cents (handled per checkout / host policy)`,
    `- Cleaning fee (listing): ${l.cleaningFeeCents} cents`,
    ``,
    `## House rules & cancellation`,
    l.houseRules ? l.houseRules : `_See listing page for house rules._`,
    ``,
    `**Cancellation policy:** ${l.cancellationPolicy ?? "As published on the listing."}`,
    ``,
    `_This summary is for trust & transparency. For enforceable terms, refer to the platform booking contract accepted at checkout._`,
  ];

  const contentMarkdown = lines.join("\n");

  const row = await prisma.bnhubBookingAgreementSnapshot.create({
    data: {
      bookingId,
      documentUrl: options?.documentUrl ?? null,
      contentMarkdown,
    },
  });

  return { id: row.id, contentMarkdown, documentUrl: row.documentUrl, createdAt: row.createdAt };
}
