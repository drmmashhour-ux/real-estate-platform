import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const CANCELED = [
  "CANCELLED",
  "CANCELLED_BY_GUEST",
  "CANCELLED_BY_HOST",
  "DECLINED",
  "EXPIRED",
] as const;

export type HostBookingsFilter = {
  search?: string;
  status?: string;
  listingId?: string;
  paymentStatus?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  tab?: "upcoming" | "ongoing" | "past" | "canceled" | "all";
};

function tabWhere(tab: HostBookingsFilter["tab"], now: Date): Prisma.BookingWhereInput {
  if (!tab || tab === "all") {
    return {};
  }
  if (tab === "canceled") {
    return { status: { in: [...CANCELED] } };
  }
  if (tab === "upcoming") {
    return {
      checkIn: { gte: now },
      status: { notIn: [...CANCELED] },
    };
  }
  if (tab === "ongoing") {
    return {
      checkIn: { lte: now },
      checkOut: { gte: now },
      status: { notIn: [...CANCELED] },
    };
  }
  if (tab === "past") {
    return {
      checkOut: { lt: now },
      status: { notIn: [...CANCELED] },
    };
  }
  return {};
}

export type HostBookingListRow = {
  id: string;
  confirmationCode: string | null;
  guestName: string;
  propertyTitle: string;
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestsCount: number | null;
  totalCents: number | null;
  bookingStatus: string;
  paymentStatus: string | null;
  guestId: string;
  guestEmail: string | null;
};

export async function getHostBookings(
  hostId: string,
  filters: HostBookingsFilter = {}
): Promise<HostBookingListRow[]> {
  const now = new Date();
  const tab = filters.tab ?? "upcoming";
  const search = filters.search?.trim().toLowerCase();

  const where: Prisma.BookingWhereInput = {
    listing: { ownerId: hostId },
    ...tabWhere(tab, now),
  };

  if (filters.listingId?.trim()) {
    where.listingId = filters.listingId.trim();
  }

  if (filters.status?.trim()) {
    where.status = filters.status.trim() as BookingStatus;
  }

  if (filters.paymentStatus) {
    where.payment = { status: filters.paymentStatus };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.checkIn = {};
    if (filters.dateFrom) where.checkIn.gte = filters.dateFrom;
    if (filters.dateTo) where.checkIn.lte = filters.dateTo;
  }

  const rows = await prisma.booking.findMany({
    where,
    orderBy: {
      checkIn: tab === "past" || tab === "canceled" || tab === "all" ? "desc" : "asc",
    },
    take: 200,
    select: {
      id: true,
      confirmationCode: true,
      status: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestsCount: true,
      guestContactName: true,
      guestContactEmail: true,
      guestContactPhone: true,
      guestId: true,
      listingId: true,
      guest: { select: { name: true, email: true } },
      listing: { select: { title: true } },
      payment: { select: { amountCents: true, status: true } },
    },
  });

  let out: HostBookingListRow[] = rows.map((b) => ({
    id: b.id,
    confirmationCode: b.confirmationCode,
    guestName:
      b.guestContactName?.trim() ||
      b.guest?.name?.trim() ||
      b.guest?.email ||
      b.guestContactEmail ||
      "Guest",
    propertyTitle: b.listing.title,
    listingId: b.listingId,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    guestsCount: b.guestsCount,
    totalCents: b.payment?.amountCents ?? null,
    bookingStatus: b.status,
    paymentStatus: b.payment?.status ?? null,
    guestId: b.guestId,
    guestEmail: b.guest?.email ?? b.guestContactEmail ?? null,
  }));

  if (search) {
    out = out.filter(
      (b) =>
        b.guestName.toLowerCase().includes(search) ||
        b.propertyTitle.toLowerCase().includes(search) ||
        b.id.toLowerCase().includes(search) ||
        (b.confirmationCode?.toLowerCase().includes(search) ?? false)
    );
  }

  return out;
}
