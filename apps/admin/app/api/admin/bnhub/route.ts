import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { bnhubV2Flags } from "@/config/feature-flags";
import { subDays } from "date-fns";
import { BookingStatus, BnhubFraudFlagStatus, ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Aggregated BNHub control surface for admin — requires platform admin. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!bnhubV2Flags.bnhubAdminControlV1) {
    return Response.json({ error: "BNHub admin control disabled" }, { status: 403 });
  }

  const since = subDays(new Date(), 7);
  const [publishedListings, bookingsWeek, openBnhubFraud, disputesOpen] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.booking.count({
      where: { createdAt: { gte: since }, status: { notIn: [BookingStatus.EXPIRED] } },
    }),
    prisma.bnhubFraudFlag.count({
      where: {
        status: {
          in: [
            BnhubFraudFlagStatus.OPEN,
            BnhubFraudFlagStatus.UNDER_REVIEW,
            BnhubFraudFlagStatus.ESCALATED,
          ],
        },
      },
    }),
    prisma.dispute.count({
      where: { status: { in: ["OPEN", "SUBMITTED", "UNDER_REVIEW", "EVIDENCE_REVIEW", "ESCALATED"] } },
    }),
  ]);

  return Response.json({
    generatedAt: new Date().toISOString(),
    publishedListings,
    bookingsLast7d: bookingsWeek,
    openBnhubFraudFlags: openBnhubFraud,
    openDisputes: disputesOpen,
    links: {
      controlSummary: "/api/bnhub/admin/control-summary",
      legacyAdminBnhub: "/admin/bnhub",
    },
  });
}
