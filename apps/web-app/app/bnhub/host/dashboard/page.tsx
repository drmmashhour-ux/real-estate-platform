import Link from "next/link";
import { getListingsByOwner } from "@/lib/bnhub/listings";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { prisma } from "@/lib/db";
import { HostDashboardClient } from "./host-dashboard-client";

export default async function HostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string }>;
}) {
  const { ownerId } = await searchParams;
  const effectiveOwnerId = ownerId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;

  let listings: Awaited<ReturnType<typeof getListingsByOwner>> = [];
  let bookings: Awaited<ReturnType<typeof getBookingsForHost>> = [];
  let earningsCents = 0;

  if (effectiveOwnerId) {
    listings = await getListingsByOwner(effectiveOwnerId);
    bookings = await getBookingsForHost(effectiveOwnerId);
    const completedPayments = await prisma.payment.findMany({
      where: {
        booking: { listing: { ownerId: effectiveOwnerId } },
        status: "COMPLETED",
      },
    });
    earningsCents = completedPayments.reduce((sum, p) => sum + p.hostPayoutCents, 0);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            BNHub Host
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Host dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Manage your short-term rental listings, bookings, and earnings.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/bnhub"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              ← Back to search
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {!effectiveOwnerId ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <p className="text-slate-400">
                Sign in as a host or set <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">NEXT_PUBLIC_DEMO_HOST_ID</code> (User id) to view your dashboard.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Or add <code className="rounded bg-slate-800 px-1.5 py-0.5">?ownerId=YOUR_USER_ID</code> to the URL.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Listings</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-100">{listings.length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Upcoming bookings</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-100">
                    {bookings.filter((b) => b.status === "CONFIRMED" && new Date(b.checkIn) >= new Date()).length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Earnings (completed)</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-300">
                    ${(earningsCents / 100).toFixed(0)}
                  </p>
                </div>
              </div>

              <HostDashboardClient
                ownerId={effectiveOwnerId}
                listings={listings}
                bookings={bookings}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
