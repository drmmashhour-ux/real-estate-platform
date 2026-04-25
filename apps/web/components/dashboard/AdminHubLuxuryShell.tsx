"use client";

import Link from "next/link";

import type { AdminDashboardSummaryData } from "@/modules/dashboard/view-models";
import { formatCadCompactFromCents } from "@/modules/dashboard/services/format-dashboard-currency";

const hubCards = [
  {
    title: "Buyer Hub",
    description: "Search activity, saved homes, buyer trends, conversion flow.",
    slug: "buyer",
    stat: "12.4K searches",
  },
  {
    title: "Seller Hub",
    description: "Listings created, views, seller leads, listing quality.",
    slug: "seller",
    stat: "184 active listings",
  },
  {
    title: "Broker Hub",
    description: "Lead flow, CRM pipeline, conversions, unlocked leads.",
    slug: "broker",
    stat: "326 active leads",
  },
  {
    title: "Investor Hub",
    description: "Portfolio activity, opportunities, ROI dashboards, signals.",
    slug: "investor",
    stat: "$4.82M tracked",
  },
  {
    title: "BNHub",
    description: "Short-term stays, hosts, bookings, occupancy, payouts.",
    slug: "bnhub",
    stat: "91 live stays",
  },
  {
    title: "Rent Hub",
    description: "Rental listings, applications, document flow, occupancy.",
    slug: "rent",
    stat: "73 applications",
  },
] as const;

const aiInsights = [
  "Seller Hub engagement is strongest in premium Montréal listings today.",
  "BNHub revenue is trending above the 7-day average by 11.2%.",
  "Broker Hub shows increased investor-lead demand in Downtown Montréal.",
  "Refund risk is slightly elevated in one BNHub booking cluster.",
] as const;

const commandModules: { title: string; description: string; href: string }[] = [
  {
    title: "Users & roles",
    description: "Accounts, invitations, permissions, audit trail.",
    hrefKey: "adminUsers",
  },
  {
    title: "Listings control",
    description: "Moderation, quality, FSBO pipeline, syndication.",
    hrefKey: "adminListings",
  },
  {
    title: "Bookings & transactions",
    description: "Deals, BNHub bookings, payments, payouts.",
    hrefKey: "adminDeals",
  },
  {
    title: "Broker / lead control",
    description: "Pipeline, incentives, CRM execution, acquisition.",
    hrefKey: "adminBrokers",
  },
  {
    title: "Investor oversight",
    description: "Revenue, pitch tools, portfolio intelligence hooks.",
    hrefKey: "adminInvestor",
  },
  {
    title: "Messages & support",
    description: "AI inbox, disputes, Immo contacts, escalations.",
    hrefKey: "adminInbox",
  },
].map((x) => x); // typed below with href resolver

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30"
    >
      <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/50">{sub}</div>
    </Link>
  );
}

function HubCard({
  title,
  description,
  href,
  stat,
}: {
  title: string;
  description: string;
  href: string;
  stat: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6 transition hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:shadow-[0_0_60px_rgba(212,175,55,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-medium text-white">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-white/58">{description}</p>
        </div>
        <div className="h-12 w-12 shrink-0 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10" aria-hidden />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-[#D4AF37]">{stat}</span>
        <span className="text-sm text-white/45 group-hover:text-[#D4AF37]">Open →</span>
      </div>
    </Link>
  );
}

function InsightCard({ text, href }: { text: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/70 transition hover:border-[#D4AF37]/25 hover:text-white/90"
    >
      {text}
    </Link>
  );
}

type Props = {
  locale: string;
  country: string;
  /** KPI rollups from `getAdminDashboardSummaryData`; when absent, illustrative fallbacks display. */
  summary?: AdminDashboardSummaryData | null;
};

export function AdminHubLuxuryShell({ locale, country, summary }: Props) {
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const topAdmin = `/${locale}/${country}/admin`;
  const classicHref = `${adminBase}?classic=1`;

  const hrefs = {
    revenue: `${adminBase}/revenue`,
    movements: `${adminBase}/movements`,
    transactions: `${adminBase}/transactions`,
    aiAnalysis: `${adminBase}/ai-analysis`,
    governance: `${adminBase}/governance`,
    hubsIndex: `${adminBase}/hubs`,
    risk: `${adminBase}/risk`,
    users: `${topAdmin}/users`,
    listings: `${topAdmin}/listings`,
    deals: `${topAdmin}/deals`,
    brokers: `${topAdmin}/brokers`,
    investor: `${topAdmin}/investor`,
    inbox: `${topAdmin}/ai-inbox`,
    defensibility: `${adminBase}/defensibility`,
    outreach: `/admin/outreach`,
    bookings: `/admin/bookings`,
    execution: `/admin/execution`,
    closing: `/admin/closing`,
  };

  const modules: { title: string; description: string; href: string }[] = [
    { title: "Users & roles", description: "Accounts, invitations, permissions.", href: hrefs.users },
    { title: "Listings control", description: "Moderation, FSBO, quality gates.", href: hrefs.listings },
    { title: "Bookings & transactions", description: "Deals and settlement activity.", href: hrefs.deals },
    { title: "Broker / lead control", description: "Pipeline and broker operations.", href: hrefs.brokers },
    { title: "Investor oversight", description: "Investor revenue and intelligence.", href: hrefs.investor },
    { title: "Messages & support", description: "AI inbox and escalations.", href: hrefs.inbox },
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-xs text-white/45 sm:text-start">
          {summary ?
            "Top-row KPIs reflect today’s database rollups (UTC day boundaries)."
          : "Live metrics below are illustrative until reporting modules are wired."}{" "}
          <Link href={classicHref} className="text-[#D4AF37] underline-offset-4 hover:underline">
            Open classic operations home
          </Link>
        </p>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Admin Command Center</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Control the entire platform.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
              Monitor all hubs, review revenue, inspect movements, and use AI-driven analysis to understand what is happening
              across LECIPM in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={hrefs.revenue}
              className="rounded-full border border-[#D4AF37]/45 px-5 py-3 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Daily Report
            </Link>
            <Link
              href={hrefs.aiAnalysis}
              className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
            >
              AI Analysis
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Platform Revenue Today"
            value={summary ? formatCadCompactFromCents(summary.revenueTodayCents) : "$12.8K"}
            sub="Across all hubs"
            href={hrefs.revenue}
          />
          <StatCard
            label="Bookings Today"
            value={summary ? String(summary.bookingsToday) : "48"}
            sub="BNHub + Rent activity"
            href={hrefs.movements}
          />
          <StatCard
            label="Leads Today"
            value={summary ? String(summary.leadsToday) : "63"}
            sub="Buyer / Seller / Broker movement"
            href={`${adminBase}/hubs/broker`}
          />
          <StatCard
            label="New Users"
            value={summary ? String(summary.newUsersToday) : "29"}
            sub="Daily platform growth"
            href={hrefs.users}
          />
          <StatCard
            label="Risk Alerts"
            value={summary ? String(summary.riskAlertsApprox) : "4"}
            sub="Requires admin review"
            href={hrefs.risk}
          />
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-white">Hub Control</h2>
              <Link href={hrefs.hubsIndex} className="text-sm text-[#D4AF37] hover:underline">
                View All Hubs
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {hubCards.map((hub) => (
                <HubCard
                  key={hub.slug}
                  title={hub.title}
                  description={hub.description}
                  stat={hub.stat}
                  href={`${adminBase}/hubs/${hub.slug}`}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">AI analysis</div>
              <div className="mt-5 space-y-3">
                {aiInsights.map((item) => (
                  <InsightCard key={item} text={item} href={hrefs.aiAnalysis} />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Quick access</div>
              <div className="mt-5 grid gap-3">
                <Link
                  href={hrefs.movements}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Platform movements
                </Link>
                <Link
                  href={hrefs.transactions}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Transactions ledger
                </Link>
                <Link
                  href={hrefs.revenue}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Revenue & reports
                </Link>
                <Link
                  href={hrefs.governance}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Governance & risk
                </Link>
                <Link
                  href={hrefs.users}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Users & roles
                </Link>
                <Link
                  href={hrefs.defensibility}
                  className="rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/5 px-4 py-3 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Moat & Defensibility
                </Link>
                <Link
                  href={hrefs.outreach}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Outreach Engine
                </Link>
                <Link
                  href={hrefs.bookings}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Booking Manager
                </Link>
                <Link
                  href={hrefs.execution}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  Execution Engine
                </Link>
                <Link
                  href={hrefs.closing}
                  className="rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/5 px-4 py-3 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Closing Accelerator
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-12 grid gap-6 xl:grid-cols-3">
          <Link
            href={hrefs.revenue}
            className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0B0B0B] p-6 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Revenue</div>
            <h3 className="mt-3 text-2xl font-medium text-white">Daily income report</h3>
            <p className="mt-3 text-sm leading-7 text-white/58">
              Review income from each hub, transaction volume, daily summaries, and chart-based reporting.
            </p>
          </Link>

          <Link
            href={hrefs.movements}
            className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0B0B0B] p-6 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Activity</div>
            <h3 className="mt-3 text-2xl font-medium text-white">Platform movements</h3>
            <p className="mt-3 text-sm leading-7 text-white/58">
              Track new listings, bookings, lead unlocks, signups, messages, payouts, and all important platform actions.
            </p>
          </Link>

          <Link
            href={hrefs.aiAnalysis}
            className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0B0B0B] p-6 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Intelligence</div>
            <h3 className="mt-3 text-2xl font-medium text-white">AI analysis center</h3>
            <p className="mt-3 text-sm leading-7 text-white/58">
              Surface trends, weak points, risk signals, high-performing hubs, and operational recommendations.
            </p>
          </Link>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-medium text-white">Command Modules</h2>
            <p className="text-sm text-white/45">Deep links across admin tooling</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="rounded-[24px] border border-white/8 bg-[#111111] p-5 transition hover:border-[#D4AF37]/35"
              >
                <h3 className="text-lg font-medium text-white">{m.title}</h3>
                <p className="mt-2 text-sm text-white/55">{m.description}</p>
                <span className="mt-4 inline-block text-sm text-[#D4AF37]">Open →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
