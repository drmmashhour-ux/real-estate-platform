import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminBookingFilters = {
  search?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  listingId?: string;
  hostId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AdminBookingRow = {
  id: string;
  confirmationCode: string | null;
  status: BookingStatus;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  guestEmail: string | null;
  propertyTitle: string;
  hostName: string | null;
  hostEmail: string | null;
  totalCents: number | null;
  paymentStatus: string | null;
};

export type AdminBookingSummaryStrip = {
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingRefunds: number;
  failedPayments: number;
};

export async function getAdminBookingSummaryStrip(): Promise<AdminBookingSummaryStrip> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [todayCheckIns, todayCheckOuts, pendingRefunds, failedPayments] = await Promise.all([
    prisma.booking.count({
      where: { checkIn: { gte: start, lt: end } },
    }),
    prisma.booking.count({
      where: { checkOut: { gte: start, lt: end } },
    }),
    prisma.payment.count({
      where: {
        status: { in: [PaymentStatus.PARTIALLY_REFUNDED] },
        updatedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
  ]);

  return { todayCheckIns, todayCheckOuts, pendingRefunds, failedPayments };
}

export async function getAdminBookings(
  filters: AdminBookingFilters = {},
  take = 150
): Promise<AdminBookingRow[]> {
  const where: Prisma.BookingWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.listingId?.trim()) where.listingId = filters.listingId.trim();
  if (filters.hostId?.trim()) where.listing = { ownerId: filters.hostId.trim() };
  if (filters.paymentStatus) where.payment = { status: filters.paymentStatus };
  if (filters.dateFrom || filters.dateTo) {
    where.checkIn = {};
    if (filters.dateFrom) where.checkIn.gte = filters.dateFrom;
    if (filters.dateTo) where.checkIn.lte = filters.dateTo;
  }

  const rows = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      confirmationCode: true,
      status: true,
      checkIn: true,
      checkOut: true,
      guestContactName: true,
      guestContactEmail: true,
      guest: { select: { name: true, email: true } },
      listing: {
        select: {
          title: true,
          owner: { select: { name: true, email: true } },
        },
      },
      payment: { select: { amountCents: true, status: true } },
    },
  });

  let out: AdminBookingRow[] = rows.map((b) => ({
    id: b.id,
    confirmationCode: b.confirmationCode,
    status: b.status,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guestName:
      b.guestContactName?.trim() || b.guest?.name?.trim() || b.guest?.email || b.guestContactEmail || "Guest",
    guestEmail: b.guestContactEmail ?? b.guest?.email ?? null,
    propertyTitle: b.listing.title,
    hostName: b.listing.owner.name,
    hostEmail: b.listing.owner.email,
    totalCents: b.payment?.amountCents ?? null,
    paymentStatus: b.payment?.status ?? null,
  }));

  const q = filters.search?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        (b.confirmationCode?.toLowerCase().includes(q) ?? false) ||
        b.guestName.toLowerCase().includes(q) ||
        (b.guestEmail?.toLowerCase().includes(q) ?? false) ||
        b.propertyTitle.toLowerCase().includes(q)
    );
  }

  return out;
}
