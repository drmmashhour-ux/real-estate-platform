"use client";

import Link from "next/link";

export type AdminHubSlug = "buyer" | "seller" | "broker" | "investor" | "bnhub" | "rent";

type Props = {
  hub: AdminHubSlug;
  hubTitle: string;
  adminBase: string;
};

const HUB_DATA: Record<
  AdminHubSlug,
  {
    kpis: { label: string; value: string; sub: string }[];
    incomeToday: string;
    recentActivity: string[];
    movements: { time: string; type: string; detail: string }[];
    userActions: { label: string; metric: string }[];
    aiSummary: string;
  }
> = {
  buyer: {
    kpis: [
      { label: "Searches Today", value: "2,184", sub: "Across sessions" },
      { label: "Saved Homes", value: "643", sub: "Active wishlists" },
      { label: "New Users", value: "28", sub: "Last 24h" },
      { label: "Conversion Rate", value: "14.2%", sub: "Signup → serious intent" },
    ],
    incomeToday: "$1,240",
    recentActivity: [
      "User searched Westmount luxury homes",
      "3 new saved listings added",
      "New user registered from Montréal",
    ],
    movements: [
      { time: "10:18", type: "Signup", detail: "New buyer from Ville-Marie funnel" },
      { time: "09:02", type: "Saved search", detail: "Westmount price band alert" },
      { time: "08:40", type: "Message", detail: "Buyer asked for private showing" },
    ],
    userActions: [
      { label: "Tours scheduled", metric: "14" },
      { label: "Offers drafted", metric: "3" },
      { label: "Returning visitors", metric: "62%" },
    ],
    aiSummary:
      "Buyer demand is concentrated in premium corridors; investor co-browsing is rising with broker lead views. Consider merchandising lender partners on high-intent PDPs.",
  },
  seller: {
    recentActivity: [
      "Luxury listing published in Westmount",
      "Seller uploaded new media pack",
      "Price optimization suggestion accepted",
    ],
    kpis: [
      { label: "New drafts", value: "9", sub: "Last 24h" },
      { label: "Live listings", value: "184", sub: "Hub total" },
      { label: "Median time to live", value: "2.1d", sub: "Publish SLA" },
      { label: "Quality score", value: "81", sub: "Weighted" },
    ],
    incomeToday: "$2,880",
    movements: [
      { time: "09:12", type: "New listing", detail: "Luxury villa draft in Westmount" },
      { time: "08:10", type: "Media upload", detail: "4K tour added — Outremont" },
      { time: "Yesterday", type: "Verification", detail: "FSBO package submitted" },
    ],
    userActions: [
      { label: "Listings published", metric: "7" },
      { label: "Pricing updates", metric: "12" },
      { label: "Support tickets", metric: "2" },
    ],
    aiSummary:
      "Two long-running drafts show low media completeness; nudge sellers with checklist prompts before weekend traffic peaks.",
  },
  broker: {
    recentActivity: [
      "Investor lead unlocked — Downtown Montréal",
      "CRM sequence advanced for Plateau buyer",
      "Broker tagged listing as hot lead",
    ],
    kpis: [
      { label: "Active leads", value: "326", sub: "Pipeline" },
      { label: "Unlock revenue", value: "$3.6K", sub: "Today est." },
      { label: "Avg response", value: "42m", sub: "SLA clock" },
      { label: "Investor mix", value: "28%", sub: "Of new leads" },
    ],
    incomeToday: "$3,575",
    movements: [
      { time: "09:40", type: "Lead unlock", detail: "Investor lead — Downtown Montréal" },
      { time: "09:05", type: "CRM sync", detail: "Pipeline stage advanced" },
      { time: "08:22", type: "Call logged", detail: "Follow-up booked" },
    ],
    userActions: [
      { label: "Sequences fired", metric: "58" },
      { label: "Meetings booked", metric: "11" },
      { label: "Deals advanced", metric: "6" },
    ],
    aiSummary:
      "Investor-grade leads outperform residential conversion this week — prioritize unlock inventory in central districts.",
  },
  investor: {
    recentActivity: [
      "Portfolio stress test saved",
      "Cap-rate alert triggered on downtown asset",
      "Scenario exported to PDF",
    ],
    kpis: [
      { label: "Active scenarios", value: "54", sub: "Models" },
      { label: "Signals fired", value: "12", sub: "24h" },
      { label: "Avg modeled ROI", value: "8.3%", sub: "Blended" },
      { label: "Allocator runs", value: "19", sub: "Today" },
    ],
    incomeToday: "$980",
    movements: [
      { time: "11:30", type: "Scenario saved", detail: "Laval waterfront stress test" },
      { time: "10:55", type: "Alert", detail: "Cap rate drift on downtown asset" },
      { time: "09:48", type: "Export", detail: "Portfolio memo PDF" },
    ],
    userActions: [
      { label: "Planner sessions", metric: "37" },
      { label: "Shares generated", metric: "8" },
      { label: "Capital commits", metric: "—" },
    ],
    aiSummary:
      "Portfolio sentiment stable; acquisition alerts clustering in premium submarkets — align BNHub crossover investors with broker unlock promos.",
  },
  bnhub: {
    kpis: [
      { label: "Occupancy", value: "82%", sub: "30d rolling" },
      { label: "ADR", value: "$214", sub: "Blended" },
      { label: "Bookings today", value: "31", sub: "Gross" },
      { label: "Dispute rate", value: "0.6%", sub: "30d" },
    ],
    incomeToday: "$3,420",
    movements: [
      { time: "10:05", type: "Booking", detail: "2-night stay — Old Montréal" },
      { time: "09:50", type: "Payout", detail: "Host payout batch #4481" },
      { time: "09:15", type: "Review", detail: "5★ stay signal" },
    ],
    userActions: [
      { label: "Messages threaded", metric: "210" },
      { label: "Pricing edits", metric: "16" },
      { label: "Moderation flags", metric: "1" },
    ],
    aiSummary:
      "Booking velocity ahead of 7-day baseline; maintain payout latency monitoring on weekend clusters.",
  },
  rent: {
    recentActivity: [
      "Rental application submitted — Laval",
      "Income docs verified",
      "Lease draft sent for countersign",
    ],
    kpis: [
      { label: "Applications", value: "73", sub: "Open" },
      { label: "Lease signed", value: "6", sub: "This week" },
      { label: "Doc completion", value: "74%", sub: "Avg" },
      { label: "Risk score", value: "Low", sub: "Portfolio" },
    ],
    incomeToday: "$710",
    movements: [
      { time: "11:02", type: "Application", detail: "Laval rental — income verified" },
      { time: "10:11", type: "Screening", detail: "Credit pull authorized" },
      { time: "09:33", type: "Lease draft", detail: "Template sent for countersign" },
    ],
    userActions: [
      { label: "Showings booked", metric: "22" },
      { label: "Deposit holds", metric: "5" },
      { label: "Renewals emailed", metric: "18" },
    ],
    aiSummary:
      "Application throughput healthy; tighten document nudges on low-completion tenants before month-end cutoff.",
  },
};

export function AdminHubDetailLuxuryClient({ hub, hubTitle, adminBase }: Props) {
  const data = HUB_DATA[hub];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">{hubTitle}</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{hubTitle} Analysis</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              KPI snapshot, telemetry placeholders, recent movements, income attribution, user actions, and AI commentary for this hub.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`${adminBase}/movements`} className="rounded-full border border-[#D4AF37]/35 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10">
              Global Movements
            </Link>
            <Link href={`${adminBase}/ai-analysis`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 hover:border-[#D4AF37]/35">
              AI Analysis
            </Link>
            <Link href={`${adminBase}/hubs`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/55 hover:text-[#D4AF37]">
              ← All hubs
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((k) => (
            <div key={k.label} className="rounded-[26px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-5">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{k.value}</div>
              <div className="mt-1 text-sm text-white/45">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,#111,#0a0a0a)] px-6 py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Hub Income (Today)</div>
              <div className="mt-2 text-3xl font-semibold text-[#D4AF37]">{data.incomeToday}</div>
            </div>
            <Link href={`${adminBase}/revenue`} className="text-sm text-white/55 hover:text-[#D4AF37]">
              Full revenue breakdown →
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
          <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Recent Activity</div>
          <div className="space-y-3">
            {data.recentActivity.map((line) => (
              <div key={line} className="rounded-2xl border border-white/8 bg-[#111111] px-4 py-3 text-sm leading-7 text-white/75">
                {line}
              </div>
            ))}
          </div>
        </div>

        <section className="mt-10 grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Performance chart</div>
            <div className="flex h-[280px] items-center justify-center rounded-[22px] border border-white/8 bg-[#111111] text-sm text-white/35">
              Hub trend &amp; throughput chart — wire your time series
            </div>
          </div>

          <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-6">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">AI Summary</div>
            <p className="mt-4 text-sm leading-7 text-white/65">{data.aiSummary}</p>
            <Link href={`${adminBase}/ai-analysis`} className="mt-6 inline-block text-sm text-[#D4AF37] hover:underline">
              Open intelligence center →
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-5 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Latest movements</div>
            <div className="space-y-3">
              {data.movements.map((m) => (
                <div
                  key={`${m.time}-${m.type}`}
                  className="flex flex-col gap-1 rounded-2xl border border-white/8 bg-[#111111] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm text-[#D4AF37]">{m.time}</div>
                    <div className="font-medium text-white">{m.type}</div>
                    <div className="text-sm text-white/55">{m.detail}</div>
                  </div>
                  <Link href={`${adminBase}/movements`} className="text-xs text-white/40 hover:text-[#D4AF37]">
                    Timeline
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-5 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">User actions</div>
            <div className="space-y-3">
              {data.userActions.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#111111] px-4 py-3"
                >
                  <span className="text-sm text-white/75">{row.label}</span>
                  <span className="font-semibold tabular-nums text-white">{row.metric}</span>
                </div>
              ))}
            </div>
            <Link href={`${adminBase}/revenue`} className="mt-6 inline-block text-sm text-[#D4AF37] hover:underline">
              Trace to revenue attribution →
            </Link>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-white/8 pt-8">
          <Link href={adminBase} className="text-sm text-white/45 hover:text-[#D4AF37]">
            Command Center
          </Link>
          <Link href={`${adminBase}/revenue`} className="text-sm text-white/45 hover:text-[#D4AF37]">
            Revenue
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/30">Demonstration metrics — replace with warehouse / event stream queries.</p>
      </div>
    </main>
  );
}
