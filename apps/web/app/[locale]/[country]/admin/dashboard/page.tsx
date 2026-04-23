import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@repo/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { getAdminAiSummary } from "@/lib/ai/brain";
import { AdminAiActionCenterDynamic } from "../AdminAiActionCenterDynamic";
import { AdminOpenCanvaButtonDynamic } from "../AdminOpenCanvaButtonDynamic";
import { getAdminOverviewStats } from "@/lib/admin/get-admin-overview";
import { getSmartDashboardData } from "@/lib/admin/get-smart-dashboard";
import { SmartAdminDashboard } from "@/components/admin/SmartAdminDashboard";
import { AdminCityIntelligence } from "@/components/admin/AdminCityIntelligence";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { AdminHubCharts } from "@/components/admin/AdminHubCharts";
import { AdminHubAiSection } from "@/components/ai/AdminHubAiSection";
import { AdminDailyAiReportCard } from "@/components/ai/AdminDailyAiReportCard";
import { BrandGuidelineStrip } from "@/components/brand/BrandGuidelineStrip";
import { AISummaryWidget } from "@/components/ai/AISummaryWidget";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";
import { AdminMonetizationOverview } from "@/components/admin/AdminMonetizationOverview";
import { getLecipmMonetizationSummary } from "@/modules/revenue/lecipm-monetization-summary.service";

export default async function AdminHubDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const role = await getUserRole();
  const theme = getHubTheme("admin");
  const guestId = await getGuestId();
  const dbUser = guestId
    ? await prisma.user.findUnique({ where: { id: guestId }, select: { role: true } })
    : null;

  if (dbUser?.role === "ACCOUNTANT") {
    redirect("/admin/finance");
  }

  const aiSummary = getAdminAiSummary();
  const [overview, platformStats, contentPacks, smartDashboard, monetizationSummary] = await Promise.all([
    getAdminOverviewStats(),
    getPlatformStats(30),
    prisma.formSubmission.findMany({
      where: {
        formType: "broker_content_pack",
      },
      select: {
        assignedTo: true,
        payloadJson: true,
      },
      take: 250,
    }),
    getSmartDashboardData(),
    getLecipmMonetizationSummary(30).catch(() => null),
  ]);
  const now = new Date();
  const reminderQueue = contentPacks
    .map((row) => ({
      assignedTo: row.assignedTo,
      payload: (row.payloadJson ?? {}) as Record<string, unknown>,
    }))
    .filter(
      (row) =>
        row.payload.campaignStatus === "planned" &&
        typeof row.payload.plannedFor === "string" &&
        typeof row.payload.reminderHoursBefore === "number" &&
        !row.payload.reminderDismissedAt
    )
    .map((row) => {
      const plannedFor = new Date(String(row.payload.plannedFor));
      const reminderAt = new Date(
        plannedFor.getTime() - Number(row.payload.reminderHoursBefore) * 60 * 60 * 1000
      );
      return {
        assignedTo: row.assignedTo,
        plannedFor,
        reminderAt,
      };
    })
    .filter((item) => !Number.isNaN(item.plannedFor.getTime()) && !Number.isNaN(item.reminderAt.getTime()));
  const contentReminderStats = {
    dueNow: reminderQueue.filter((item) => item.reminderAt <= now).length,
    upcoming: reminderQueue.filter((item) => item.reminderAt > now).length,
    brokersActive: new Set(reminderQueue.map((item) => item.assignedTo).filter(Boolean)).size,
  };
  const adminRecommendations = [
    {
      id: "1",
      title: "AI alerts",
      description: `${aiSummary.alertsCount} active alerts. Review and acknowledge in the AI Control Center.`,
      urgency: (aiSummary.alertsCount > 0 ? "high" : "low") as "high" | "low",
      actionLabel: "View alerts",
      actionHref: "/admin/ai",
    },
    {
      id: "2",
      title: "Unusual activity detection",
      description: `Fraud flags: ${aiSummary.fraudFlags}. Unusual patterns are highlighted for review.`,
      urgency: (aiSummary.fraudFlags > 0 ? "high" : "low") as "high" | "low",
      actionLabel: "Fraud dashboard",
      actionHref: "/admin/fraud",
    },
    {
      id: "3",
      title: "Revenue insights",
      description: aiSummary.revenueOpportunitySummary,
      urgency: "low" as const,
      actionLabel: "Revenue",
      actionHref: "/admin/revenue",
    },
  ];

  return (
    <HubLayout
      title="AdminHub"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-8">
        <HubJourneyBanner hub="admin" locale={locale} country={country} userId={guestId} />
        {smartDashboard && (
          <section className="rounded-2xl border border-premium-gold/25 bg-[#050505] p-6 shadow-[0_0_40px_rgba(212,175,55,0.06)]">
            <SmartAdminDashboard data={smartDashboard} />
          </section>
        )}
        <AdminMonetizationOverview summary={monetizationSummary} />
        {overview && (
          <>
            <section className="flex flex-wrap gap-3">
              <Link
                href="/ai"
                className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
              >
                LECIPM Manager AI control center
              </Link>
              <Link
                href="/admin/risk-monitoring"
                className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
              >
                AI Risk Monitoring (seller declarations)
              </Link>
              <Link
                href="/admin/timeline"
                className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
              >
                Global timeline (listing · booking · user)
              </Link>
              <Link
                href="/admin/immo-contact"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                ImmoContact control
              </Link>
              <Link
                href="/admin/finance"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                Finance
              </Link>
              <Link
                href="/admin/follow-up"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                Follow-up engine
              </Link>
              <Link
                href="/admin/content-ops"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                Content ops
              </Link>
              <Link
                href="/admin/listings"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                Listing control
              </Link>
            </section>
            <AISummaryWidget />

            <section className="rounded-2xl border border-premium-gold/20 bg-black/25 p-1">
              <BrandGuidelineStrip />
            </section>

            <section className="rounded-2xl border border-premium-gold/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(11,11,11,0.95))] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">
                    Broker Content Reminder Oversight
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Platform-wide campaign reminder monitoring</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Monitor scheduled broker content reminders across the platform and jump into broker workspaces when follow-up is due.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/follow-up"
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
                  >
                    Follow-up engine
                  </Link>
                  <Link
                    href="/dashboard/broker/content-studio"
                    className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
                  >
                    Open broker content ops
                  </Link>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-200">Due now</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{contentReminderStats.dueNow.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-400">Reminder tasks currently inside their action window.</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Upcoming reminders</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{contentReminderStats.upcoming.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-400">Scheduled reminder tasks still ahead of their alert time.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Brokers active</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{contentReminderStats.brokersActive.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-400">Distinct broker workspaces with active reminder queue items.</p>
                </div>
              </div>
            </section>

            <section
              className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5"
              data-testid="admin-dashboard-law-forms-strip"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                Law helper &amp; form tools
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Compliance drafting, client form review, and structured contract field templates.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/admin/legal-ai"
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
                >
                  Law helper (AI monitor + drafting)
                </Link>
                <Link
                  href="/admin/legal"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-emerald-500/40 hover:text-white"
                >
                  Legal documents hub
                </Link>
                <Link
                  href="/admin/forms"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-emerald-500/40 hover:text-white"
                >
                  Form filler &amp; submissions
                </Link>
                <Link
                  href="/admin/contracts-builder"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-emerald-500/40 hover:text-white"
                >
                  Contract template builder
                </Link>
              </div>
            </section>

            <AdminHubAiSection />

            {overview ? (
              <section className="rounded-2xl border border-premium-gold/20 bg-black/40 p-5">
                <AdminDailyAiReportCard
                  stats={{
                    totalUsers: overview.totalUsers,
                    totalListings: overview.totalListings,
                    activeListings: overview.activeListings,
                    totalBookings: overview.totalBookings,
                    bookingsToday: overview.bookingsToday,
                    revenueTodayCents: overview.revenueTodayCents,
                    openDisputesCount: overview.openDisputesCount,
                    pendingPayoutsCount: overview.pendingPayoutsCount,
                  }}
                />
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Total users</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.totalUsers.toLocaleString()}</p>
                <Link href="/admin/users" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  Manage users →
                </Link>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Total listings</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.totalListings.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white0">Active (visible): {overview.activeListings.toLocaleString()}</p>
                <Link href="/admin/listings" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  Listings hub →
                </Link>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Active bookings</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.activeBookingsCount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white0">Today new: {overview.bookingsToday.toLocaleString()}</p>
                <Link href="/admin/bookings" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  View bookings →
                </Link>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Revenue today</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${(overview.revenueTodayCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-white0">Paid platform checkouts</p>
                <Link href="/admin/finance" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  Finance →
                </Link>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Revenue (7 days)</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${(overview.revenueWeekCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-white0">Rolling week</p>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Revenue (30 days)</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${(overview.revenueMonthCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-white0">Rolling month</p>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Open disputes</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.openDisputesCount.toLocaleString()}</p>
                <Link href="/admin/disputes" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  Dispute center →
                </Link>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Pending payouts</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.pendingPayoutsCount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white0">BNHUB host transfer not released</p>
                <Link href="/admin/payouts" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  Payout management →
                </Link>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Contracts</p>
                <p className="mt-2 text-sm text-premium-text-muted">Signed agreements & links</p>
                <Link href="/admin/contracts" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-premium-gold">
                  Contract view →
                </Link>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white0">All-time bookings</p>
                <p className="mt-1 text-xl font-semibold text-white">{overview.totalBookings.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white0">Deals</p>
                <p className="mt-1 text-xl font-semibold text-white">{overview.totalDeals.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white0">Revenue (all completed)</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  ${(overview.revenueCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white0">Platform fees (BNHUB)</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  ${(overview.commissionCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-sm font-semibold text-premium-gold">AI summary</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-white0">Daily (24h)</p>
                  <p className="mt-1 text-sm text-white/85">
                    {aiSummary.alertsCount} active alerts · {aiSummary.fraudFlags} fraud flags · {aiSummary.revenueOpportunitySummary}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-white0">Weekly (30d trend)</p>
                  <p className="mt-1 text-sm text-white/85">
                    Platform activity in charts below; review revenue & funnels in{" "}
                    <Link href="/admin/revenue" className="text-premium-gold hover:underline">
                      analytics
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        <AdminHubCharts stats={platformStats} />

        <AdminCityIntelligence />

        {/* Feature shortcuts */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Overview", sub: "Mission & health", href: "/admin/dashboard" },
            { label: "Content ops case files", sub: "Broker campaign reminders", href: "/admin/content-ops" },
            { label: "Moderation case files", sub: "Approve / reject", href: "/admin/moderation" },
            { label: "Users", sub: "View, block, verify", href: "/admin/users" },
            { label: "Payments", sub: "Transactions & ledger", href: "/admin/finance/transactions" },
            { label: "Disputes", sub: "Refunds & resolution", href: "/admin/disputes" },
            { label: "Analytics", sub: "Revenue & funnels", href: "/admin/revenue" },
            { label: "Fundraising", sub: "Investors & pipeline", href: "/admin/fundraising" },
            { label: "Execution", sub: "Daily revenue discipline", href: "/admin/execution" },
            { label: "Pitch deck", sub: "Investor PPTX", href: "/admin/pitch-deck" },
            { label: "Sales team", sub: "Agents & routing", href: "/admin/sales" },
            { label: "Hiring", sub: "Candidates & rubric", href: "/admin/hiring" },
            { label: "Equity", sub: "Cap table & vesting", href: "/admin/equity" },
            { label: "Sales CRM", sub: "Pipeline & commissions", href: "/dashboard/leads/pipeline" },
            { label: "ImmoContact case files", sub: "Lead enforcement case files", href: "/admin/immocontacts" },
            { label: "FSBO case files", sub: "Seller compliance packets", href: "/admin/fsbo" },
            { label: "Referral case files", sub: "Referral revenue case files", href: "/admin/referrals" },
            { label: "Ambassador case files", sub: "Commission and payout packets", href: "/admin/ambassadors" },
          ].map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-premium-gold/40 hover:bg-premium-gold/[0.06]"
            >
              <p className="text-sm font-semibold text-premium-gold">{item.label}</p>
              <p className="mt-1 text-xs text-[#B3B3B3]">{item.sub}</p>
            </Link>
          ))}
        </section>

        {/* Admin dashboard: revenue, users, storage, logs, fraud, subscriptions, health */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/revenue"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Revenue</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-white0">View revenue</p>
          </Link>
          <Link
            href="/admin/income"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Income</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-white0">Canva income</p>
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Users</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-white0">Manage users</p>
          </Link>
          <Link
            href="/admin/legal"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Legal</p>
            <p className="mt-1 text-lg font-semibold text-white">Terms & docs</p>
            <p className="mt-0.5 text-xs text-white0">Documents & acceptance</p>
          </Link>
          <Link
            href="/admin/forms"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Forms</p>
            <p className="mt-1 text-lg font-semibold text-white">List / edit</p>
            <p className="mt-0.5 text-xs text-white0">Operational forms</p>
          </Link>
          <Link
            href="/admin/testimonials"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Testimonials</p>
            <p className="mt-1 text-lg font-semibold text-white">Approve & feature</p>
            <p className="mt-0.5 text-xs text-white0">Homepage trust content</p>
          </Link>
          <Link
            href="/admin/case-studies"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Case studies</p>
            <p className="mt-1 text-lg font-semibold text-white">Publish</p>
            <p className="mt-0.5 text-xs text-white0">Proof & outcomes</p>
          </Link>
          <Link
            href="/admin/storage"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Storage</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-white0">Platform storage</p>
          </Link>
          <Link
            href="/admin/projects-monetization"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Projects</p>
            <p className="mt-1 text-lg font-semibold text-white">Monetization</p>
            <p className="mt-0.5 text-xs text-white0">Pricing & revenue</p>
          </Link>
          <Link
            href="/admin/fraud"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Fraud alerts</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-white0">Alerts</p>
          </Link>
          <Link
            href="/admin/trust-safety"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Trust & Safety</p>
            <p className="mt-1 text-lg font-semibold text-white">Reports</p>
            <p className="mt-0.5 text-xs text-white0">Refund · Warn · Suspend</p>
          </Link>
          <Link
            href="/admin/brokers"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Brokers</p>
            <p className="mt-1 text-lg font-semibold text-white">Certification</p>
            <p className="mt-0.5 text-xs text-white0">Approve / reject applications</p>
          </Link>
          <Link
            href="/admin/logs"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-premium-gold/90">Logs</p>
            <p className="mt-1 text-lg font-semibold text-white">Audit</p>
            <p className="mt-0.5 text-xs text-white0">Audit logs</p>
          </Link>
        </div>

        {/* AI Action Center – alerts, unusual activity, revenue */}
        <AdminAiActionCenterDynamic
          hubType="admin"
          recommendations={adminRecommendations}
          theme={theme}
          performanceSummary="AI alerts, unusual activity detection, and revenue insights."
        />

        {/* Top performing hubs & system health */}
        <section className="rounded-xl border border-white/10 p-6 transition-all duration-200 hover:scale-[1.01]" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Summary</h2>
          <p className="mt-2 text-sm text-premium-text-muted">Active subscriptions/payments: —</p>
          <p className="mt-1 text-sm text-premium-text-muted">Top performing hubs: —</p>
          <p className="mt-1 text-sm text-premium-text-muted">System health: Operational</p>
          <p className="mt-1 text-sm text-premium-text-muted">AI alerts: {aiSummary.alertsCount} · Fraud flags: {aiSummary.fraudFlags}</p>
          <p className="mt-1 text-sm text-premium-text-muted">AI: {aiSummary.revenueOpportunitySummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/health" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Platform health</Link>
            <Link href="/admin/audit" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Audit logs</Link>
          </div>
        </section>

        {/* Platform mission — internal alignment */}
        <section className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Platform mission (internal reference)
          </h2>
          <p className="mt-2 text-xs text-white0">
            Single source of truth:{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-premium-text-muted">
              docs/PLATFORM-MISSION.md
            </code>
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5 text-sm">
            <p className="font-medium text-amber-400">Operating principle</p>
            <p className="mt-1 text-white/90 font-medium">AI runs the platform, user supervises.</p>
            <p className="mt-2 text-premium-text-muted text-xs">
              Automation handles operations; humans set policy, approve exceptions, and oversee outcomes.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Mission</p>
            <p className="mt-2 text-white/85">
              To connect people, licensed professionals, and investors in a
              trusted and verified digital ecosystem—enabling confident property
              discovery, professional guidance, and long-term value through
              relationship-driven real estate and lifestyle services.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Vision</p>
            <p className="mt-2 text-white/85">
              A world where every property search, investment decision, and
              professional interaction happens inside a transparent, safe, and
              relationship-oriented platform—where verification and reputation
              replace uncertainty.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Core values</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-white/85">
              <li>Trust first — Verification and transparency before scale.</li>
              <li>
                Relationships over transactions — Long-term professional and
                user relationships matter.
              </li>
              <li>
                Clear rules — Participation, conduct, and disputes governed by
                published standards.
              </li>
              <li>
                Ecosystem alignment — Success for users, professionals, owners,
                and investors together.
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-white0">
            Use this mission when making moderation decisions, designing
            features, or resolving disputes. Governance rules:{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-premium-text-muted">
              docs/PLATFORM-GOVERNANCE.md
            </code>
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="/about-platform"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              View public About platform →
            </a>
          </div>
        </section>

        {/* Admin tools */}
        <section className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Tools
          </h2>
          <nav className="mt-4 flex flex-wrap gap-2">
            <AdminOpenCanvaButtonDynamic />
            <Link href="/admin/forms" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Forms</Link>
            <Link href="/admin/contracts-builder" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Contract templates</Link>
            <a href="/admin/listing-compliance" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Listing compliance</a>
            <a href="/admin/users" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Users</a>
            <a href="/admin/controls" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Operational controls</a>
            <a href="/admin/health" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Platform health</a>
            <a href="/admin/policies" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Policy engine</a>
            <a href="/admin/moderation" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Verification queue</a>
            <a href="/admin/verifications" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Ownership verification</a>
            <a href="/admin/listings" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Listing moderation</a>
            <a href="/admin/bookings" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Bookings</a>
            <a href="/admin/fsbo" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">FSBO listings</a>
            <a href="/admin/issues" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">BNHUB issues</a>
            <a href="/admin/trust-safety" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Trust & Safety</a>
            <a href="/admin/transactions" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Transactions</a>
            <a href="/admin/incidents" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Incidents</a>
            <a href="/admin/disputes" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Dispute resolution</a>
            <a href="/admin/payouts" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Payout holds</a>
            <a href="/admin/trust-safety" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Trust & safety</a>
            <a href="/admin/fraud" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Fraud alerts</a>
            <a href="/admin/property-identities" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Property Identity Console</a>
            <a href="/admin/valuation" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">AVM Valuation</a>
            <a href="/admin/ranking" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Ranking config</a>
            <a href="/admin/supply-growth" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Supply growth</a>
            <a href="/admin/revenue" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Revenue</a>
            <a href="/admin/income" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Canva income</a>
            <a href="/admin/storage" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Storage</a>
            <a href="/admin/subscriptions" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Subscriptions</a>
            <a href="/admin/promotions" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Promotions</a>
            <a href="/admin/markets" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Markets</a>
            <a href="/admin/growth" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Growth campaigns</a>
            <a href="/admin/executive" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Executive dashboard</a>
            <a href="/admin/ai" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">AI Control Center</a>
            <a href="/admin/defense" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Platform Defense</a>
            <a href="/admin/audit" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">Audit logs</a>
            <a href="/admin/metrics" className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-premium-text-muted hover:bg-white/10 hover:text-white/90">System metrics</a>
          </nav>
          <p className="mt-4 text-sm text-white0">
            Ensure all actions align with platform mission and governance (
            <code className="rounded bg-white/10 px-1 py-0.5 text-premium-text-muted">
              docs/PLATFORM-GOVERNANCE.md
            </code>
            ).
          </p>
        </section>
      </div>
    </HubLayout>
  );
}
