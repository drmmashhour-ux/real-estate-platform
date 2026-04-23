import type { ComponentProps } from "react";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getBookingsForGuest } from "@/lib/bnhub/booking";
import { loyaltyTierFromCompletedBookings } from "@/lib/loyalty/loyalty-engine";
import { prisma } from "@repo/db";
import { BnhubGuestAppInstallCard } from "@/components/bnhub/BnhubGuestAppInstallCard";
import { BnhubMobileTabBar } from "@/components/bnhub/BnhubMobileTabBar";
import { GuestReservationCenter } from "@/components/bnhub/GuestReservationCenter";
import { TripsClient } from "./trips-client";

type TripsClientBookings = ComponentProps<typeof TripsClient>["bookings"];
type ReservationBookings = ComponentProps<typeof GuestReservationCenter>["bookings"];

export default async function BNHubTripsPage() {
  const guestId = await getGuestId();

  if (!guestId) {
    return (
      <main className="bnhub-page min-h-screen pb-[4.75rem] md:pb-0">
        <section className="border-b border-bnhub-border bg-bnhub-elevated/80">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-bnhub-text">My trips</h1>
            <p className="mt-2 text-bnhub-text-muted">Sign in to view and manage your trips.</p>
            <Link href="/bnhub/login" className="bnhub-btn bnhub-btn--primary mt-4 inline-flex w-fit no-underline">
              Sign in
            </Link>
          </div>
        </section>
        <BnhubMobileTabBar />
      </main>
    );
  }

  const [bookings, notifications, loyaltyProfile] = await Promise.all([
    getBookingsForGuest(guestId),
    prisma.notification.findMany({
      where: {
        userId: guestId,
        actionUrl: { startsWith: "/bnhub/booking/" },
        status: { in: ["UNREAD", "READ"] },
      },
      select: {
        id: true,
        title: true,
        message: true,
        actionUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.userLoyaltyProfile.findUnique({
      where: { userId: guestId },
      select: { completedBookings: true },
    }),
  ]);

  const loyalty = loyaltyTierFromCompletedBookings(loyaltyProfile?.completedBookings ?? 0);

  return (
    <main className="bnhub-page min-h-screen pb-[4.75rem] md:pb-0">
      <section className="border-b border-bnhub-border bg-bnhub-elevated/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/bnhub/stays" className="text-sm font-medium text-bnhub-gold hover:opacity-90">
            ← Back to search
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-bnhub-text sm:text-3xl">My trips</h1>
          <p className="mt-2 text-bnhub-text-muted">View your bookings and leave reviews after your stay.</p>
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-[12px] border border-bnhub-border bg-bnhub-card px-3 py-2 text-sm text-bnhub-text-secondary">
            <span className="rounded-md border border-bnhub-gold/30 bg-bnhub-main px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-bnhub-gold">
              BNHUB Rewards
            </span>
            <span>
              {loyalty.tier === "NONE"
                ? loyalty.explanation
                : `${loyalty.label} · Your loyalty discount: up to ${loyalty.discountPercent}% off eligible lodging`}
            </span>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <BnhubGuestAppInstallCard />
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
        <GuestReservationCenter
          bookings={bookings as unknown as ReservationBookings}
          notifications={notifications}
        />
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <TripsClient bookings={bookings as unknown as TripsClientBookings} />
      </section>
      <BnhubMobileTabBar />
    </main>
  );
}
