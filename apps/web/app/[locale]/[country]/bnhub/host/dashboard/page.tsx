import Link from "next/link";
import { subDays } from "date-fns";
import { getListingsByOwner } from "@/lib/bnhub/listings";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { updateHostPerformance } from "@/src/modules/reviews/aggregationService";
import { HostDashboardClient } from "./host-dashboard-client";
import { HostInsightsPanel } from "@/components/bnhub/HostInsightsPanel";
import { PotentialIssuesPanel, type PotentialIssueRow } from "@/components/bnhub/PotentialIssuesPanel";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import {
  UnifiedListerDashboardEmpty,
  UnifiedListerDashboardFrame,
  UnifiedListerStatStrip,
} from "@/components/dashboard/UnifiedListerDashboardFrame";
import { resolveListerOwnerId } from "@/lib/dashboard/resolve-lister-owner";
import { HostPeaceOfMindStrip } from "@/components/bnhub/HostPeaceOfMindStrip";
import { aggregateGuestOrigins } from "@/lib/bnhub/guest-origin-geo";
import { buildMonthlyHostFinance } from "@/lib/bnhub/host-monthly-finance";
import { HostFinanceBars } from "@/components/bnhub/HostFinanceBars";
import { HostGuestOriginsMap } from "@/components/bnhub/HostGuestOriginsMap";
import { BnHubOfferSectionsPlaybook } from "@/components/bnhub/BnHubOfferSectionsPlaybook";

export default async function HostDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ ownerId?: string }>;
}) {
  const { ownerId: ownerIdParam } = (await searchParams) ?? {};
  const sessionUserId = await getGuestId();

  const effectiveOwnerId = resolveListerOwnerId({
    explicitOwnerId: ownerIdParam,
    sessionUserId,
    demoOwnerIdEnv: process.env.NEXT_PUBLIC_DEMO_HOST_ID,
  });

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

  let potentialIssues: PotentialIssueRow[] = [];
  if (effectiveOwnerId) {
    const logs = await prisma.aiDisputeRiskLog.findMany({
      where: {
        booking: { listing: { ownerId: effectiveOwnerId } },
        createdAt: { gte: subDays(new Date(), 21) },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        booking: {
          select: {
            id: true,
            listing: { select: { title: true } },
          },
        },
      },
    });
    potentialIssues = logs.map((l) => ({
      id: l.id,
      bookingId: l.bookingId,
      riskLevel: l.riskLevel,
      signalType: l.signalType,
      summary: l.summary,
      createdAt: l.createdAt.toISOString(),
      listingTitle: l.booking.listing.title,
    }));
  }

  const publishedListingsCount = listings.filter((l) => l.listingStatus === "PUBLISHED").length;
  const inProgressListingsCount = listings.length - publishedListingsCount;
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86400000);
  const guestsArrivingNext7Days = bookings.filter((b) => {
    if (b.status !== "CONFIRMED") return false;
    const ci = new Date(b.checkIn);
    return ci >= now && ci <= inSevenDays;
  }).length;

  const guestOrigins = effectiveOwnerId ? aggregateGuestOrigins(bookings) : [];
  const monthlyFinance = effectiveOwnerId ? buildMonthlyHostFinance(bookings) : [];

  const navItems = [
    { href: "/bnhub", label: "BNHUB home" },
    { href: "/dashboard/bnhub", label: "Guest dashboard" },
    { href: "/bnhub/stays", label: "Find a stay" },
    { href: "/bnhub/trips", label: "Trips" },
    { href: "/bnhub/travel/compare", label: "Travel AI" },
    { href: "/bnhub/host/dashboard", label: "Host dashboard", current: true },
    { href: "/bnhub/host/marketing", label: "Marketing" },
    { href: "/bnhub/host/growth", label: "Growth" },
  ] as const;

  return (
    <UnifiedListerDashboardFrame
      brandHref="/bnhub"
      eyebrow="Host dashboard"
      title="Manage your short-term rentals"
      subtitle="Listings, bookings, earnings, and early risk signals in one place — fewer tabs than juggling OTAs, MLS, and PM software, and clearer for guests too."
      navItems={[...navItems]}
      sessionSignedIn={Boolean(sessionUserId)}
      signInHref="/auth/login?next=/bnhub/host/dashboard"
      accountHref="/dashboard"
      heroExtra={
        effectiveOwnerId ? (
          <Link
            href="/dashboard/host"
            className="inline-flex rounded-xl border border-premium-gold/35 bg-premium-gold/10 px-5 py-2.5 text-sm font-semibold text-premium-gold hover:bg-premium-gold/15"
          >
            Host calendar &amp; payouts →
          </Link>
        ) : null
      }
    >
      {!effectiveOwnerId ? (
        <>
          <div id="bnhub-offer-playbook" className="mb-10 scroll-mt-28">
            <BnHubOfferSectionsPlaybook embedded />
          </div>
          <UnifiedListerDashboardEmpty browseHref="/bnhub/stays" browseLabel="Browse stays" />
        </>
      ) : (
        <>
          <HostPeaceOfMindStrip
            trustScore={hostTrust?.performance.score ?? null}
            publishedListings={publishedListingsCount}
            inProgressListings={inProgressListingsCount}
            upcomingConfirmed={upcomingCount}
            guestsArrivingNext7Days={guestsArrivingNext7Days}
            attentionSignalCount={potentialIssues.length}
            stripePayoutsReady={Boolean(hostStripe?.stripeAccountId && hostStripe?.stripeOnboardingComplete)}
          />

          <div id="bnhub-offer-playbook" className="mb-10 scroll-mt-28">
            <BnHubOfferSectionsPlaybook embedded />
          </div>

          <HostFinanceBars rows={monthlyFinance} />

          <HostGuestOriginsMap origins={guestOrigins} totalBookings={bookings.length} />

          {hostDecision ? (
            <div className="mb-8">
              <DecisionCard
                title="AI Booking Summary"
                result={hostDecision}
                actionHref={hostListingId ? `/bnhub/host/listings/${hostListingId}/edit` : "/host/listings/new"}
                actionLabel={hostListingId ? "Review listing" : "Start listing"}
              />
            </div>
          ) : null}

          <div className="mb-10">
            <HostInsightsPanel ownerId={effectiveOwnerId} />
          </div>

          {potentialIssues.length > 0 ? (
            <div id="host-attention" className="mb-10 scroll-mt-28">
              <PotentialIssuesPanel items={potentialIssues} />
            </div>
          ) : null}

          {hostTrust ? (
              <div className="bnhub-panel mb-10 p-5">
                  <h2 className="text-sm font-semibold text-premium-gold">Guest trust and performance</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Score blends response speed, completed stays, cancellations, and disputes (0–100).
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Host score</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{hostTrust.performance.score}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Response rate</p>
                      <p className="mt-1 text-lg text-neutral-200">
                        {(hostTrust.performance.responseRate * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Avg. response time</p>
                      <p className="mt-1 text-lg text-neutral-200">
                        {hostTrust.performance.avgResponseTime < 0.05
                          ? "—"
                          : `${hostTrust.performance.avgResponseTime.toFixed(1)} h`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Completion / cancel</p>
                      <p className="mt-1 text-sm text-neutral-200">
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
                          className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-3 py-1 text-xs font-medium text-premium-gold"
                        >
                          {b.badgeType.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-neutral-500">Badges unlock as your metrics improve.</p>
                  )}
                </div>
          ) : null}

          <UnifiedListerStatStrip
            items={[
              { label: "Listings", value: String(listings.length) },
              { label: "Upcoming bookings", value: String(upcomingCount) },
              {
                label: "Earnings (completed)",
                value: `$${(earningsCents / 100).toFixed(0)}`,
                valueClassName: "text-premium-gold",
              },
            ]}
          />

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
    </UnifiedListerDashboardFrame>
  );
}
