/**
 * Internal demand proxies: BNHub bookings + CRM leads tied to Montreal stays.
 */

import { prisma } from "@/lib/db";
import { subDays } from "date-fns";
import { BookingStatus } from "@prisma/client";
import { prismaWhereMontrealShortTerm } from "./neighborhood-clustering.service";

const ACTIVE_BOOKING: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_HOST_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

export async function countMontrealBookingsSince(since: Date): Promise<number> {
  return prisma.booking.count({
    where: {
      createdAt: { gte: since },
      status: { in: ACTIVE_BOOKING },
      listing: prismaWhereMontrealShortTerm(),
    },
  });
}

/** Leads with a BNHub listing in Montreal in the time window (real CRM rows only). */
export async function countMontrealBnhubLeadsSince(since: Date): Promise<number> {
  return prisma.lead.count({
    where: {
      createdAt: { gte: since },
      shortTermListingId: { not: null },
      bnhubStayForLead: prismaWhereMontrealShortTerm(),
    },
  });
}

export async function getMontrealDemandBaselines(windowDays: number): Promise<{
  bookings: number;
  bnhubLeads: number;
  since: string;
}> {
  const since = subDays(new Date(), windowDays);
  const [bookings, bnhubLeads] = await Promise.all([
    countMontrealBookingsSince(since),
    countMontrealBnhubLeadsSince(since),
  ]);
  return { bookings, bnhubLeads, since: since.toISOString() };
}
