import Link from "next/link";
import { getListingsByOwner } from "@/lib/bnhub/listings";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { updateHostPerformance } from "@/src/modules/reviews/aggregationService";
import Logo from "@/components/ui/Logo";
import { HostDashboardClient } from "./host-dashboard-client";
import { HostInsightsPanel } from "@/components/bnhub/HostInsightsPanel";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";

export default async function HostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string }>;
}) {
  const { ownerId } = await searchParams;
  const [sessionUserId, effectiveOwnerId] = await Promise.all([
    getGuestId(),
    Promise.resolve(ownerId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null),
  ]);

  let listings: Awaited<ReturnType<typeof getListingsByOwner>> = [];
  let bookings: Awaited<ReturnType<typeof getBookingsForHost>> = [];
  let earningsCents = 0;
  let hostStripe: {
    stripeAccountId: string | null;
    stripeOnboardingComplete: boolean;
  } | null = null;

  if (effectiveOwnerId) {
    listings = await getListingsByOwner(effectiveOwnerId);
    bookings = await getBookingsForHost(effectiveOwnerId);
    const completedPayments = await prisma.payment.findMany({
      where: {
        booking: { listing: { ownerId: effectiveOwnerId } },
        status: "COMPLETED",
      },
    });
    earningsCents = completedPayments.reduce((sum, p) => sum + (p.hostPayoutCents ?? 0), 0);
    hostStripe = await prisma.user.findUnique({
      where: { id: effectiveOwnerId },
      select: { stripeAccountId: true, stripeOnboardingComplete: true },
    });
  }

  const upcomingCount =
    effectiveOwnerId
      ? bookings.filter(
          (b) => b.status === "CONFIRMED" && new Date(b.checkIn) >= new Date()
        ).length
      : 0;

  const hostListingId = listings[0]?.id ?? null;

  let hostTrust: {
    performance: {
      score: number;
      responseRate: number;
      avgResponseTime: number;
      cancellationRate: number;
      completionRate: number;
      disputeRate: number;
    };
    badges: { id: string; badgeType: string; assignedAt: Date }[];
  } | null = null;
  if (effectiveOwnerId) {
    let performance = await prisma.hostPerformance.findUnique({
      where: { hostId: effectiveOwnerId },
    });
    if (!performance) {
      performance = await updateHostPerformance(effectiveOwnerId);
    }
    const badges = await prisma.hostBadge.findMany({
      where: { hostId: effectiveOwnerId },
      orderBy: { assignedAt: "desc" },
    });
    hostTrust = { performance, badges };
  }

  const hostDecision =
    effectiveOwnerId != null
      ? await safeEvaluateDecision({
          hub: "bnhub",
          userId: effectiveOwnerId,
          userRole: "USER",
          entityType: hostListingId ? "listing" : "platform",
          entityId: hostListingId,
          listingVariant: hostListingId ? "short_term" : undefined,
        })
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <Logo showName className="text-white [&_span]:text-white" />
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/bnhub/stays"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Find a stay
            </Link>
            <span className="text-sm font-medium text-emerald-400">
              Host dashboard
            </span>
            <Link
              href="/bnhub/host/marketing"
              className="text-sm font-medium text-slate-300 hover:text-amber-400"
            >
              Marketing
            </Link>
            <Link
              href="/bnhub/host/growth"
              className="text-sm font-medium text-slate-300 hover:text-amber-400"
            >
              Growth
            </Link>
            <Link
              href="/bnhub/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Host dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Manage your short-term rentals
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Listings, bookings, earnings, and tools in one place.
          </p>
          {effectiveOwnerId ? (
            <div className="mt-6">
              <Link
                href="/dashboard/host"
                className="inline-flex rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15"
              >
                Host calendar & payouts →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Content */}
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {!effectiveOwnerId ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">
                Sign in as a host or set{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                  NEXT_PUBLIC_DEMO_HOST_ID
                </code>{" "}
                (User id) to view your dashboard.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Or add{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5">
                  ?ownerId=YOUR_USER_ID
                </code>{" "}
                to the URL.
              </p>
              <Link
                href="/bnhub/stays"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← Browse stays
              </Link>
            </div>
          ) : (
            <>
              {/* Stats row */}
              {hostDecision ? (
                <div className="mb-8">
                  <DecisionCard
                    title="AI Booking Summary"
                    result={hostDecision}
                    actionHref={hostListingId ? `/bnhub/host/listings/${hostListingId}/edit` : "/bnhub/host/listings/new"}
                    actionLabel={hostListingId ? "Review listing" : "New listing"}
                  />
                </div>
              ) : null}

              <div className="mb-10">
                <HostInsightsPanel ownerId={effectiveOwnerId} />
              </div>

              {hostTrust ? (
                <div className="mb-10 rounded-2xl border border-emerald-500/25 bg-emerald-950/15 p-5">
                  <h2 className="text-sm font-semibold text-emerald-200">Guest trust & performance</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Score blends response speed, completed stays, cancellations, and disputes (0–100).
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Host score</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{hostTrust.performance.score}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Response rate</p>
                      <p className="mt-1 text-lg text-slate-200">
                        {(hostTrust.performance.responseRate * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Avg. response time</p>
                      <p className="mt-1 text-lg text-slate-200">
                        {hostTrust.performance.avgResponseTime < 0.05
                          ? "—"
                          : `${hostTrust.performance.avgResponseTime.toFixed(1)} h`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Completion / cancel</p>
                      <p className="mt-1 text-sm text-slate-200">
                        {(hostTrust.performance.completionRate * 100).toFixed(0)}% ·{" "}
                        {(hostTrust.performance.cancellationRate * 100).toFixed(0)}% cancelled
                      </p>
                    </div>
                  </div>
                  {hostTrust.badges.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {hostTrust.badges.map((b) => (
                        <span
                          key={b.id}
                          className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100"
                        >
                          {b.badgeType.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">Badges unlock as your metrics improve.</p>
                  )}
                </div>
              ) : null}

              <div className="mb-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Listings
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    {listings.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Upcoming bookings
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    {upcomingCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Earnings (completed)
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-400 sm:text-3xl">
                    ${(earningsCents / 100).toFixed(0)}
                  </p>
                </div>
              </div>

              <HostDashboardClient
                ownerId={effectiveOwnerId}
                listings={listings}
                bookings={bookings}
                canManageStripe={sessionUserId === effectiveOwnerId}
                hostStripe={
                  hostStripe ?? {
                    stripeAccountId: null,
                    stripeOnboardingComplete: false,
                  }
                }
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
