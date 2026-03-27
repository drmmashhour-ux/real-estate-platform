import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { getApprovedHost, getHostByUserId, hasAcceptedHostAgreement } from "@/lib/bnhub/host";
import { requirePlatformAcceptance } from "@/lib/legal/require-acceptance";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { VerificationChecklist } from "@/components/bnhub/VerificationChecklist";
import { prisma } from "@/lib/db";

export default async function BNHubHostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string; applied?: string }>;
}) {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");
  const { ownerId: ownerIdFromQuery, applied } = await searchParams;

  const userId = await getGuestId();
  const ownerId =
    ownerIdFromQuery ?? userId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;

  await requirePlatformAcceptance(ownerId ?? null);

  if (!ownerId) {
    return (
      <HubLayout
        title="BNHub"
        hubKey="bnhub"
        navigation={hubNavigation.bnhub}
        showAdminInSwitcher={role === "admin"}
      >
        <div className="space-y-6">
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Host dashboard
          </h1>
          <p className="text-sm opacity-80">
            Sign in to access the host dashboard or apply to become a host.
          </p>
          <div className="flex gap-3">
            <Link
              href="/bnhub/login"
              className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: theme.accent }}
            >
              Sign in
            </Link>
            <Link
              href="/bnhub/become-host"
              className="inline-block rounded-lg border border-white/30 px-4 py-2 text-sm font-medium opacity-90 hover:opacity-100"
            >
              Become a host
            </Link>
          </div>
        </div>
      </HubLayout>
    );
  }

  const host = await getHostByUserId(ownerId);
  const approvedHost = await getApprovedHost(ownerId);

  if (!host) {
    return (
      <HubLayout
        title="BNHub"
        hubKey="bnhub"
        navigation={hubNavigation.bnhub}
        showAdminInSwitcher={role === "admin"}
      >
        <div className="space-y-6">
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Host dashboard
          </h1>
          <p className="text-sm opacity-80">
            Only approved hosts can access the dashboard. Apply first and we&apos;ll
            review your application.
          </p>
          <Link
            href="/bnhub/become-host"
            className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: theme.accent }}
          >
            Apply to become a host
          </Link>
        </div>
      </HubLayout>
    );
  }

  if (host.status === "pending") {
    return (
      <HubLayout
        title="BNHub"
        hubKey="bnhub"
        navigation={hubNavigation.bnhub}
        showAdminInSwitcher={role === "admin"}
      >
        <div className="space-y-6">
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Application pending
          </h1>
          <p className="text-sm opacity-80">
            Your host application is under review. We&apos;ll notify you once
            approved. You can then create listings and access the full dashboard.
          </p>
          {applied === "1" && (
            <p className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
              Application submitted successfully.
            </p>
          )}
        </div>
      </HubLayout>
    );
  }

  if (host.status === "rejected") {
    return (
      <HubLayout
        title="BNHub"
        hubKey="bnhub"
        navigation={hubNavigation.bnhub}
        showAdminInSwitcher={role === "admin"}
      >
        <div className="space-y-6">
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Application not approved
          </h1>
          <p className="text-sm opacity-80">
            Your host application was not approved. Contact support if you have
            questions.
          </p>
        </div>
      </HubLayout>
    );
  }

  if (!approvedHost) {
    redirect("/bnhub/become-host");
  }

  const agreementAccepted = await hasAcceptedHostAgreement(approvedHost.id);
  if (!agreementAccepted) {
    return (
      <HubLayout
        title="BNHub"
        hubKey="bnhub"
        navigation={hubNavigation.bnhub}
        showAdminInSwitcher={role === "admin"}
      >
        <div className="space-y-6">
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Accept Host Agreement
          </h1>
          <p className="text-sm opacity-80">
            You must read and accept the BNHub Host Terms and Guest Protection requirements before creating, publishing, or managing listings.
          </p>
          <Link
            href="/bnhub/host-agreement"
            className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: theme.accent }}
          >
            Review and accept agreement
          </Link>
          <Link
            href="/dashboard/bnhub"
            className="ml-3 inline-block rounded-lg border border-white/30 px-4 py-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            Back to dashboard
          </Link>
        </div>
      </HubLayout>
    );
  }

  const hostListings = await prisma.bnhubHostListing.findMany({
    where: { hostId: approvedHost.id },
    orderBy: { createdAt: "desc" },
  });

  const [hostEarningsAgg, hostRecentPaid] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        booking: { listing: { ownerId } },
      },
      _sum: {
        amountCents: true,
        platformFeeCents: true,
        hostPayoutCents: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        booking: { listing: { ownerId } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        amountCents: true,
        platformFeeCents: true,
        hostPayoutCents: true,
        updatedAt: true,
        booking: {
          select: {
            confirmationCode: true,
            listing: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  const fmtCents = (c: number | null | undefined) =>
    `$${((c ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <HubLayout
      title="BNHub"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={role === "admin"}
      quickActions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/bnhub/host/new"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: theme.accent }}
          >
            Create new listing
          </Link>
          <Link
            href="/bnhub/verify-id"
            className="inline-flex items-center rounded-lg border border-white/30 px-4 py-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            Verify ID
          </Link>
          <Link
            href="/bnhub/host-agreement"
            className="inline-flex items-center rounded-lg border border-white/30 px-4 py-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            Host Agreement
          </Link>
          <Link
            href="/dashboard/bnhub"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium opacity-80 hover:underline"
            style={{ color: theme.accent }}
          >
            ← Back
          </Link>
        </div>
      }
    >
        <div className="space-y-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
              Host dashboard
            </h1>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40">
              Host terms accepted
            </span>
          </div>
          <p className="mt-1 text-sm opacity-80">
            Manage your listings, bookings, and performance.
          </p>
          <p className="mt-1 text-xs opacity-70">
            Listings must comply with platform standards and local regulations.
          </p>
        </div>

        {/* Mandatory verification: required before publishing any listing */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <VerificationChecklist />
        </section>

        {/* My listings */}
        <section>
          <h2 className="mb-4 text-lg font-medium" style={{ color: theme.text }}>
            My listings
          </h2>
          {hostListings.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm opacity-80">
                No listings yet. Create your first listing to get started.
              </p>
              <Link
                href="/dashboard/bnhub/host/new"
                className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: theme.accent }}
              >
                Create listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hostListings.map((l) => (
                <div
                  key={l.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">{l.title}</h3>
                    <p className="text-sm opacity-80">
                      ${Number(l.price).toFixed(0)} / night
                    </p>
                    <p className="text-sm opacity-80">{l.location}</p>
                    <p className="text-xs opacity-60">Up to {l.maxGuests} guests</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href="/dashboard/bnhub/bookings"
                      className="inline-flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium opacity-90 hover:opacity-100"
                      style={{ color: theme.accent }}
                    >
                      View bookings
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My bookings (placeholder) */}
        <section>
          <h2 className="mb-4 text-lg font-medium" style={{ color: theme.text }}>
            My bookings
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm opacity-80">
              Booking management — coming soon. View bookings from the main BNHub
              dashboard.
            </p>
            <Link
              href="/dashboard/bnhub/bookings"
              className="mt-3 inline-block text-sm font-medium"
              style={{ color: theme.accent }}
            >
              Open bookings →
            </Link>
          </div>
        </section>

        {/* Revenue & Performance */}
        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="mb-4 text-lg font-medium" style={{ color: theme.text }}>
              Revenue
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-wide opacity-60">Completed stays (Stripe)</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="opacity-80">Guest paid (gross)</dt>
                  <dd className="font-semibold text-emerald-300">
                    {fmtCents(hostEarningsAgg._sum.amountCents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-80">Platform fee (~15%)</dt>
                  <dd className="font-medium text-amber-300">
                    {fmtCents(hostEarningsAgg._sum.platformFeeCents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-80">Your payout (~85%)</dt>
                  <dd className="font-semibold text-white">{fmtCents(hostEarningsAgg._sum.hostPayoutCents)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] opacity-60">
                Totals reflect confirmed bookings only. Stripe controls payout timing to your Connect account.
              </p>
              {hostRecentPaid.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs opacity-90">
                  {hostRecentPaid.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate">
                        {p.booking.listing.title}{" "}
                        <span className="opacity-60">({p.booking.confirmationCode ?? "—"})</span>
                      </span>
                      <span className="shrink-0 text-emerald-300">{fmtCents(p.hostPayoutCents)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm opacity-70">No completed payouts yet.</p>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium" style={{ color: theme.text }}>
              Performance
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm opacity-80">
                Views, conversion, and ratings — coming soon.
              </p>
            </div>
          </section>
        </div>
      </div>
    </HubLayout>
  );
}
