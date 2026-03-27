import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { getAdminAiSummary } from "@/lib/ai/brain";
import { AdminAiActionCenterDynamic } from "../AdminAiActionCenterDynamic";
import { AdminOpenCanvaButtonDynamic } from "../AdminOpenCanvaButtonDynamic";
import { getAdminOverviewStats } from "@/lib/admin/get-admin-overview";
import { AdminCityIntelligence } from "@/components/admin/AdminCityIntelligence";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { AdminHubCharts } from "@/components/admin/AdminHubCharts";
import { AdminHubAiSection } from "@/components/ai/AdminHubAiSection";
import { AdminDailyAiReportCard } from "@/components/ai/AdminDailyAiReportCard";

export default async function AdminHubDashboardPage() {
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
  const [overview, platformStats] = await Promise.all([getAdminOverviewStats(), getPlatformStats(30)]);
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
        {overview && (
          <>
            <section className="flex flex-wrap gap-3">
              <Link
                href="/admin/risk-monitoring"
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                AI Risk Monitoring (seller declarations)
              </Link>
              <Link
                href="/admin/timeline"
                className="rounded-xl border border-[#C9A646]/40 bg-[#C9A646]/10 px-4 py-2 text-sm font-semibold text-[#C9A646] hover:bg-[#C9A646]/20"
              >
                Global timeline (listing · booking · user)
              </Link>
              <Link
                href="/admin/immo-contact"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-[#C9A646]/40 hover:text-white"
              >
                ImmoContact control
              </Link>
              <Link
                href="/admin/finance"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-[#C9A646]/40 hover:text-white"
              >
                Finance
              </Link>
              <Link
                href="/admin/listings"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-[#C9A646]/40 hover:text-white"
              >
                Listing control
              </Link>
            </section>

            <AdminHubAiSection />

            {overview ? (
              <section className="rounded-2xl border border-[#C9A646]/20 bg-slate-900/40 p-5">
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
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Total users</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.totalUsers.toLocaleString()}</p>
                <Link href="/admin/users" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  Manage users →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Total listings</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.totalListings.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">Active (visible): {overview.activeListings.toLocaleString()}</p>
                <Link href="/admin/listings" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  Listings hub →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Active bookings</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.activeBookingsCount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">Today new: {overview.bookingsToday.toLocaleString()}</p>
                <Link href="/admin/bookings" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  View bookings →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Revenue today</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${(overview.revenueTodayCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-slate-500">Paid platform checkouts</p>
                <Link href="/admin/finance" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  Finance →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Revenue (7 days)</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${(overview.revenueWeekCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-slate-500">Rolling week</p>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Revenue (30 days)</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${(overview.revenueMonthCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-slate-500">Rolling month</p>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Open disputes</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.openDisputesCount.toLocaleString()}</p>
                <Link href="/admin/disputes" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  Dispute center →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Pending payouts</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overview.pendingPayoutsCount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">BNHub host transfer not released</p>
                <Link href="/admin/payouts" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  Payout management →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Contracts</p>
                <p className="mt-2 text-sm text-slate-400">Signed agreements & links</p>
                <Link href="/admin/contracts" className="mt-2 inline-block text-xs text-[#B3B3B3] hover:text-[#C9A646]">
                  Contract view →
                </Link>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">All-time bookings</p>
                <p className="mt-1 text-xl font-semibold text-white">{overview.totalBookings.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deals</p>
                <p className="mt-1 text-xl font-semibold text-white">{overview.totalDeals.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue (all completed)</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  ${(overview.revenueCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform fees (BNHub)</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  ${(overview.commissionCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-sm font-semibold text-[#C9A646]">AI summary</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-slate-500">Daily (24h)</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {aiSummary.alertsCount} active alerts · {aiSummary.fraudFlags} fraud flags · {aiSummary.revenueOpportunitySummary}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Weekly (30d trend)</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Platform activity in charts below; review revenue & funnels in{" "}
                    <Link href="/admin/revenue" className="text-[#C9A646] hover:underline">
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
            { label: "Listings management", sub: "Approve / reject", href: "/admin/moderation" },
            { label: "Users", sub: "View, block, verify", href: "/admin/users" },
            { label: "Payments", sub: "Transactions & ledger", href: "/admin/finance/transactions" },
            { label: "Disputes", sub: "Refunds & resolution", href: "/admin/disputes" },
            { label: "Analytics", sub: "Revenue & funnels", href: "/admin/revenue" },
            { label: "Sales CRM", sub: "Pipeline & commissions", href: "/dashboard/leads/pipeline" },
          ].map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#C9A646]/40 hover:bg-[#C9A646]/[0.06]"
            >
              <p className="text-sm font-semibold text-[#C9A646]">{item.label}</p>
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
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Revenue</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-slate-500">View revenue</p>
          </Link>
          <Link
            href="/admin/income"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Income</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-slate-500">Canva income</p>
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Users</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-slate-500">Manage users</p>
          </Link>
          <Link
            href="/admin/legal"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Legal</p>
            <p className="mt-1 text-lg font-semibold text-white">Terms & docs</p>
            <p className="mt-0.5 text-xs text-slate-500">Documents & acceptance</p>
          </Link>
          <Link
            href="/admin/forms"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Forms</p>
            <p className="mt-1 text-lg font-semibold text-white">List / edit</p>
            <p className="mt-0.5 text-xs text-slate-500">Operational forms</p>
          </Link>
          <Link
            href="/admin/testimonials"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Testimonials</p>
            <p className="mt-1 text-lg font-semibold text-white">Approve & feature</p>
            <p className="mt-0.5 text-xs text-slate-500">Homepage trust content</p>
          </Link>
          <Link
            href="/admin/case-studies"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Case studies</p>
            <p className="mt-1 text-lg font-semibold text-white">Publish</p>
            <p className="mt-0.5 text-xs text-slate-500">Proof & outcomes</p>
          </Link>
          <Link
            href="/admin/storage"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Storage</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-slate-500">Platform storage</p>
          </Link>
          <Link
            href="/admin/projects-monetization"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Projects</p>
            <p className="mt-1 text-lg font-semibold text-white">Monetization</p>
            <p className="mt-0.5 text-xs text-slate-500">Pricing & revenue</p>
          </Link>
          <Link
            href="/admin/fraud"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Fraud alerts</p>
            <p className="mt-1 text-lg font-semibold text-white">—</p>
            <p className="mt-0.5 text-xs text-slate-500">Alerts</p>
          </Link>
          <Link
            href="/admin/trust-safety"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Trust & Safety</p>
            <p className="mt-1 text-lg font-semibold text-white">Reports</p>
            <p className="mt-0.5 text-xs text-slate-500">Refund · Warn · Suspend</p>
          </Link>
          <Link
            href="/admin/brokers"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Brokers</p>
            <p className="mt-1 text-lg font-semibold text-white">Certification</p>
            <p className="mt-0.5 text-xs text-slate-500">Approve / reject applications</p>
          </Link>
          <Link
            href="/admin/logs"
            className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">Logs</p>
            <p className="mt-1 text-lg font-semibold text-white">Audit</p>
            <p className="mt-0.5 text-xs text-slate-500">Audit logs</p>
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
          <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">Summary</h2>
          <p className="mt-2 text-sm text-slate-400">Active subscriptions/payments: —</p>
          <p className="mt-1 text-sm text-slate-400">Top performing hubs: —</p>
          <p className="mt-1 text-sm text-slate-400">System health: Operational</p>
          <p className="mt-1 text-sm text-slate-400">AI alerts: {aiSummary.alertsCount} · Fraud flags: {aiSummary.fraudFlags}</p>
          <p className="mt-1 text-sm text-slate-400">AI: {aiSummary.revenueOpportunitySummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/health" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Platform health</Link>
            <Link href="/admin/audit" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Audit logs</Link>
          </div>
        </section>

        {/* Platform mission — internal alignment */}
        <section className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
            Platform mission (internal reference)
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Single source of truth:{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
              docs/PLATFORM-MISSION.md
            </code>
          </p>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
            <p className="font-medium text-amber-400">Operating principle</p>
            <p className="mt-1 text-slate-200 font-medium">AI runs the platform, user supervises.</p>
            <p className="mt-2 text-slate-400 text-xs">
              Automation handles operations; humans set policy, approve exceptions, and oversee outcomes.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Mission</p>
            <p className="mt-2 text-slate-300">
              To connect people, licensed professionals, and investors in a
              trusted and verified digital ecosystem—enabling confident property
              discovery, professional guidance, and long-term value through
              relationship-driven real estate and lifestyle services.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Vision</p>
            <p className="mt-2 text-slate-300">
              A world where every property search, investment decision, and
              professional interaction happens inside a transparent, safe, and
              relationship-oriented platform—where verification and reputation
              replace uncertainty.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Core values</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-300">
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
          <p className="mt-4 text-xs text-slate-500">
            Use this mission when making moderation decisions, designing
            features, or resolving disputes. Governance rules:{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
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
          <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
            Tools
          </h2>
          <nav className="mt-4 flex flex-wrap gap-2">
            <AdminOpenCanvaButtonDynamic />
            <Link href="/admin/forms" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Forms</Link>
            <Link href="/admin/contracts-builder" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Contract templates</Link>
            <a href="/admin/listing-compliance" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Listing compliance</a>
            <a href="/admin/users" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Users</a>
            <a href="/admin/controls" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Operational controls</a>
            <a href="/admin/health" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Platform health</a>
            <a href="/admin/policies" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Policy engine</a>
            <a href="/admin/moderation" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Verification queue</a>
            <a href="/admin/verifications" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Ownership verification</a>
            <a href="/admin/listings" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Listing moderation</a>
            <a href="/admin/bookings" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Bookings</a>
            <a href="/admin/fsbo" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">FSBO listings</a>
            <a href="/admin/issues" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">BNHub issues</a>
            <a href="/admin/trust-safety" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Trust & Safety</a>
            <a href="/admin/transactions" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Transactions</a>
            <a href="/admin/incidents" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Incidents</a>
            <a href="/admin/disputes" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Dispute resolution</a>
            <a href="/admin/payouts" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Payout holds</a>
            <a href="/admin/trust-safety" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Trust & safety</a>
            <a href="/admin/fraud" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Fraud alerts</a>
            <a href="/admin/property-identities" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Property Identity Console</a>
            <a href="/admin/valuation" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">AVM Valuation</a>
            <a href="/admin/ranking" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Ranking config</a>
            <a href="/admin/supply-growth" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Supply growth</a>
            <a href="/admin/revenue" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Revenue</a>
            <a href="/admin/income" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Canva income</a>
            <a href="/admin/storage" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Storage</a>
            <a href="/admin/subscriptions" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Subscriptions</a>
            <a href="/admin/promotions" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Promotions</a>
            <a href="/admin/markets" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Markets</a>
            <a href="/admin/growth" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Growth campaigns</a>
            <a href="/admin/executive" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Executive dashboard</a>
            <a href="/admin/ai" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">AI Control Center</a>
            <a href="/admin/defense" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Platform Defense</a>
            <a href="/admin/audit" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Audit logs</a>
            <a href="/admin/metrics" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">System metrics</a>
          </nav>
          <p className="mt-4 text-sm text-slate-500">
            Ensure all actions align with platform mission and governance (
            <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-400">
              docs/PLATFORM-GOVERNANCE.md
            </code>
            ).
          </p>
        </section>
      </div>
    </HubLayout>
  );
}
