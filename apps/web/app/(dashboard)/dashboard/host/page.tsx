import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { HostDashboardHub } from "@/components/host/HostDashboardHub";
import { getHostConversionInsights } from "@/lib/ai/conversion/conversion-engine";
import { getHostReputationForHost } from "@/lib/ai/reputation/reputation-engine";
import { updateHostPerformance } from "@/src/modules/reviews/aggregationService";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import type { CalendarBookingRow } from "@/components/calendar/BookingCalendar";

export const dynamic = "force-dynamic";

export default async function DashboardHostPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/host");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      stripeAccountId: true,
      stripeOnboardingComplete: true,
      _count: { select: { shortTermListings: true } },
    },
  });
  if (!user) redirect("/auth/login");

  const isHostish =
    user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  if (!isHostish) {
    redirect("/dashboard");
  }

  const bookings = await getBookingsForHost(userId);
  const completedPayments = await prisma.payment.findMany({
    where: {
      status: "COMPLETED",
      booking: { listing: { ownerId: userId } },
    },
    select: { hostPayoutCents: true },
  });
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      booking: { listing: { ownerId: userId } },
    },
    select: { hostPayoutCents: true },
  });
  const listingRefs = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true, listingCode: true },
    orderBy: { createdAt: "desc" },
  });

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

  const firstListingId = listingRefs[0]?.id;

  const conversionInsights = await getHostConversionInsights(prisma, userId).catch(() => []);
  void updateHostPerformance(userId).catch(() => {});
  const hostReputation = await getHostReputationForHost(prisma, userId).catch(() => null);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto mb-8 max-w-6xl">
        <AIAssistantPanel
          context={{ listingId: firstListingId, role: "HOST" }}
          agentKey="host_management"
        />
      </div>
      <HostDashboardHub
        bookings={rows}
        totalEarningsCents={totalEarningsCents}
        pendingPayoutCents={pendingPayoutCents}
        canManage
        stripeAccountId={user.stripeAccountId}
        stripeOnboardingComplete={user.stripeOnboardingComplete}
        conversionInsights={conversionInsights}
        hostReputation={hostReputation}
        listingRefs={listingRefs.map((l) => ({
          id: l.id,
          title: l.title,
          listingCode: l.listingCode,
        }))}
      />
    </div>
  );
}
