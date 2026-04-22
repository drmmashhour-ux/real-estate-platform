"use client";

import Link from "next/link";

import type { InvestorLuxuryDashboardModel } from "@/modules/dashboard/view-models";

const portfolioProperties = [
  {
    id: "pp-1",
    name: "Downtown Signature Penthouse",
    location: "Ville-Marie, Montréal",
    revenue: "$8,400 / mo",
    occupancy: "92%",
    roi: "8.7%",
    risk: "Low",
  },
  {
    id: "pp-2",
    name: "Laval Waterfront Residence",
    location: "Laval-sur-le-Lac",
    revenue: "$6,100 / mo",
    occupancy: "84%",
    roi: "7.9%",
    risk: "Medium",
  },
  {
    id: "pp-3",
    name: "Old Montréal Luxury Loft",
    location: "Old Montréal",
    revenue: "$5,450 / mo",
    occupancy: "88%",
    roi: "8.1%",
    risk: "Low",
  },
] as const;

const opportunities = [
  {
    id: "opp-1",
    area: "Westmount",
    label: "High-value appreciation zone",
    upside: "+12.4%",
  },
  {
    id: "opp-2",
    area: "Downtown Montréal",
    label: "Premium rental demand signal",
    upside: "+9.1%",
  },
  {
    id: "opp-3",
    area: "Laval-sur-le-Lac",
    label: "Undervalued luxury inventory",
    upside: "+10.7%",
  },
] as const;

const alerts = [
  "One property shows a mild payout variance this week.",
  "Occupancy momentum improved in your downtown portfolio.",
  "A high-confidence acquisition opportunity was detected in Westmount.",
] as const;

const RISK_BADGE: Record<string, string> = {
  Low: "border-green-500/25 bg-green-500/10 text-green-300",
  Medium: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  High: "border-red-500/25 bg-red-500/10 text-red-300",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/50">{sub}</div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const cls = RISK_BADGE[risk] ?? "border-white/10 bg-white/5 text-white/70";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${cls}`}>{risk}</span>
  );
}

function PortfolioRow({
  name,
  location,
  revenue,
  occupancy,
  roi,
  risk,
  openHref,
}: {
  name: string;
  location: string;
  revenue: string;
  occupancy: string;
  roi: string;
  risk: string;
  openHref: string;
}) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-white/8 bg-[#0B0B0B] px-5 py-4 xl:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_auto] xl:items-center">
      <div>
        <h4 className="font-medium text-white">{name}</h4>
        <p className="mt-1 text-sm text-white/50">{location}</p>
      </div>

      <div className="text-sm text-white/70">{revenue}</div>
      <div className="text-sm text-white/70">{occupancy}</div>
      <div className="text-sm text-white/70">{roi}</div>
      <div>
        <RiskBadge risk={risk} />
      </div>

      <Link
        href={openHref}
        className="inline-flex rounded-full border border-[#D4AF37]/35 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
      >
        Open
      </Link>
    </div>
  );
}

function OpportunityCard({
  area,
  label,
  upside,
  reviewHref,
}: {
  area: string;
  label: string;
  upside: string;
  reviewHref: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-medium text-white">{area}</h4>
          <p className="mt-2 text-sm text-white/50">{label}</p>
        </div>
        <div className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">
          {upside}
        </div>
      </div>

      <Link
        href={reviewHref}
        className="mt-5 inline-flex rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black hover:brightness-110"
      >
        Review Opportunity
      </Link>
    </div>
  );
}

type Props = {
  locale: string;
  country: string;
  /** Live portfolio metrics from `getInvestorDashboardData` — when omitted, demo constants show. */
  model?: InvestorLuxuryDashboardModel | null;
};

export function InvestorHubLuxuryShell({ locale, country, model }: Props) {
  const base = `/${locale}/${country}`;
  const classicHref = `${base}/dashboard/investor?classic=1`;
  const plannerHref = `${base}/invest/portfolio`;
  const acquisitionHref = `${base}/dashboard/investor/acquisition`;

  const portfolioRows =
    model?.portfolio?.length ?
      model.portfolio
    : portfolioProperties.map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        revenueDisplay: p.revenue,
        occupancyDisplay: p.occupancy,
        roiDisplay: p.roi,
        risk: p.risk as "Low" | "Medium" | "High",
      }));

  const alertLines = model?.alerts?.length ? model.alerts : [...alerts];
  const oppRows =
    model?.opportunities?.length ?
      model.opportunities
    : opportunities.map((o) => ({
        id: o.id,
        area: o.area,
        label: o.label,
        upsideDisplay: o.upside,
      }));

  const s = model?.stats;

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-xs text-white/45 sm:text-start">
          {model?.hasPortfolioData ?
            "Portfolio metrics reflect your saved scenarios and planner holdings."
          : "Investor intelligence — connect scenarios in the classic workspace for full modeling."}{" "}
          <Link href={classicHref} className="text-[#D4AF37] underline-offset-4 hover:underline">
            Open classic workspace
          </Link>
        </p>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Investor Hub</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Strategic portfolio intelligence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Monitor returns, track exposure, and surface premium acquisition signals through a refined investor workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={plannerHref}
              className="rounded-full border border-[#D4AF37]/45 px-5 py-3 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Portfolio Analytics
            </Link>
            <Link
              href={acquisitionHref}
              className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
            >
              Opportunities
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Portfolio value"
            value={s?.portfolioValueDisplay ?? "$4.82M"}
            sub="Current holdings"
          />
          <StatCard
            label="Monthly revenue"
            value={s?.monthlyRevenueDisplay ?? "$19.9K"}
            sub="Trailing 30 days"
          />
          <StatCard label="ROI" value={s?.roiDisplay ?? "8.3%"} sub="Blended portfolio return" />
          <StatCard
            label="Revenue at risk"
            value={s?.revenueAtRiskDisplay ?? "$3.2K"}
            sub="Current monitored exposure"
          />
          <StatCard
            label="Protected value"
            value={s?.protectedValueDisplay ?? "$41K"}
            sub="Governance-protected this quarter"
          />
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-white">Portfolio overview</h2>
              <Link href={plannerHref} className="text-sm text-[#D4AF37] hover:underline">
                Full analytics
              </Link>
            </div>

            <div className="space-y-4">
              {portfolioRows.map((property) => (
                <PortfolioRow
                  key={property.id}
                  name={property.name}
                  location={property.location}
                  revenue={property.revenueDisplay}
                  occupancy={property.occupancyDisplay}
                  roi={property.roiDisplay}
                  risk={property.risk}
                  openHref={plannerHref}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Portfolio alerts</div>
              <div className="mt-5 space-y-3">
                {alertLines.map((alert) => (
                  <div
                    key={alert}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/70"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">AI outlook</div>
              <h3 className="mt-3 text-2xl font-medium text-white">Premium growth posture</h3>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Your current portfolio shows stable occupancy, healthy demand concentration, and attractive upside in premium
                submarkets.
              </p>
              <Link
                href={plannerHref}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
              >
                Review full insight
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium text-white">Acquisition Opportunities</h2>
            <Link
              href={acquisitionHref}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
            >
              Filter Markets
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {oppRows.map((item) => (
              <OpportunityCard
                key={item.id}
                area={item.area}
                label={item.label}
                upside={item.upsideDisplay}
                reviewHref={acquisitionHref}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
