import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getBookingsForGuest } from "@/lib/bnhub/booking";
import { loyaltyTierFromCompletedBookings } from "@/lib/loyalty/loyalty-engine";
import { prisma } from "@/lib/db";
import { BnhubGuestAppInstallCard } from "@/components/bnhub/BnhubGuestAppInstallCard";
import { GuestReservationCenter } from "@/components/bnhub/GuestReservationCenter";
import { TripsClient } from "./trips-client";

export default async function BNHubTripsPage() {
  const guestId = await getGuestId();

  if (!guestId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="border-b border-slate-800 bg-slate-950/80">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold">My trips</h1>
            <p className="mt-2 text-slate-400">Sign in to view and manage your trips.</p>
            <Link
              href="/bnhub/login"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Sign in
            </Link>
          </div>
        </section>
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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/bnhub/stays" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to search
          </Link>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">My trips</h1>
          <p className="mt-2 text-slate-400">View your bookings and leave reviews after your stay.</p>
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-sm text-amber-100/95">
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-200">
              BNHub Rewards
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
        <GuestReservationCenter bookings={bookings as any} notifications={notifications} />
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <TripsClient bookings={bookings as any} />
      </section>
    </main>
  );
}
