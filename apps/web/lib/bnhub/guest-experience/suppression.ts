import { prisma } from "@/lib/db";
import { subDays } from "date-fns";
import type { PrismaClient } from "@prisma/client";

const META_KIND = "bnhub_guest_experience_v1";

export type HardBlockReason =
  | "none"
  | "open_booking_issues"
  | "high_dispute_risk"
  | "booking_disputed"
  | "guest_ignored_notifications";

/**
 * Non-financial risk signals — delay or skip review asks (never fake reviews).
 */
export async function shouldHardBlockGuestExperience(input: {
  prisma: PrismaClient;
  bookingId: string;
  guestId: string;
  now?: Date;
}): Promise<{ block: boolean; reason: HardBlockReason; delayExtraHours: number }> {
  const now = input.now ?? new Date();
  const booking = await input.prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      status: true,
      bookingIssues: { select: { status: true } },
    },
  });
  if (!booking) return { block: true, reason: "booking_disputed", delayExtraHours: 0 };

  if (booking.status === "DISPUTED") {
    return { block: true, reason: "booking_disputed", delayExtraHours: 0 };
  }

  const active = booking.bookingIssues.filter((i) => i.status === "open" || i.status === "reviewing");
  if (active.length >= 2) {
    return { block: true, reason: "open_booking_issues", delayExtraHours: 0 };
  }
  const delayExtraHours = active.length === 1 ? 72 : 0;

  const highRisk = await input.prisma.aiDisputeRiskLog.findFirst({
    where: {
      bookingId: input.bookingId,
      riskLevel: "HIGH",
      createdAt: { gte: subDays(now, 14) },
    },
    select: { id: true },
  });
  if (highRisk) {
    return { block: true, reason: "high_dispute_risk", delayExtraHours: 0 };
  }

  const recent = await input.prisma.notification.findMany({
    where: {
      userId: input.guestId,
      createdAt: { gte: subDays(now, 14) },
      OR: [
        { metadata: { path: ["kind"], equals: META_KIND } },
        { metadata: { path: ["kind"], equals: "bnhub_review_request" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { readAt: true, metadata: true },
  });

  const forBooking = recent.filter((n) => {
    const m = n.metadata as { bookingId?: string } | null;
    return m?.bookingId === input.bookingId;
  });
  const unread = forBooking.filter((n) => n.readAt == null).length;
  if (forBooking.length >= 3 && unread >= 2) {
    return { block: true, reason: "guest_ignored_notifications", delayExtraHours: 0 };
  }

  return { block: false, reason: "none", delayExtraHours };
}

export function reviewRequestDelayHours(bookingId: string, positiveExperience: boolean): number {
  let h = 0;
  for (let i = 0; i < bookingId.length; i++) {
    h = (h + bookingId.charCodeAt(i)) % 7;
  }
  const base = 6 + h;
  if (positiveExperience) {
    return Math.max(6, base - 2);
  }
  return Math.min(12, base + 2);
}
