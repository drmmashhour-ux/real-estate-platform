import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { HostDashboardHub } from "@/components/host/HostDashboardHub";
import type { CalendarBookingRow } from "@/components/calendar/BookingCalendar";

export const dynamic = "force-dynamic";

export default async function DashboardHostPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/host");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      _count: { select: { shortTermListings: true } },
    },
  });
  if (!user) redirect("/auth/login");

  const isHostish =
    user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  if (!isHostish) {
    redirect("/dashboard");
  }

  const [bookings, completedPayments, pendingPayments] = await Promise.all([
    getBookingsForHost(userId),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        booking: { listing: { ownerId: userId } },
      },
      select: { hostPayoutCents: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "PENDING",
        booking: { listing: { ownerId: userId } },
      },
      select: { hostPayoutCents: true },
    }),
  ]);

  const totalEarningsCents = completedPayments.reduce((s, p) => s + (p.hostPayoutCents ?? 0), 0);
  const pendingPayoutCents = pendingPayments.reduce((s, p) => s + (p.hostPayoutCents ?? 0), 0);

  const rows: CalendarBookingRow[] = bookings.map((b) => ({
    id: b.id,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    status: b.status,
    totalCents: b.totalCents,
    guestFeeCents: b.guestFeeCents,
    specialRequest: b.specialRequest ?? null,
    guestNotes: b.guestNotes ?? null,
    guest: b.guest,
    listing: b.listing,
    payment: b.payment
      ? { hostPayoutCents: b.payment.hostPayoutCents, status: b.payment.status }
      : null,
  }));

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-slate-100 sm:px-6">
      <HostDashboardHub
        bookings={rows}
        totalEarningsCents={totalEarningsCents}
        pendingPayoutCents={pendingPayoutCents}
        canManage
      />
    </div>
  );
}
