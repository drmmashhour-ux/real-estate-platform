"use client";

import Link from "next/link";

const pipeline = [
  {
    id: "pip-1",
    name: "Sophia Tremblay",
    stage: "New Lead",
    property: "Westmount Luxury Villa",
    value: "$3.75M",
  },
  {
    id: "pip-2",
    name: "Adam Chen",
    stage: "Qualified",
    property: "Downtown Penthouse",
    value: "$2.15M",
  },
  {
    id: "pip-3",
    name: "Nora Haddad",
    stage: "Visit Scheduled",
    property: "Laval Waterfront Home",
    value: "$1.18M",
  },
  {
    id: "pip-4",
    name: "James Carter",
    stage: "Offer",
    property: "Golden Mile Penthouse",
    value: "$1.95M",
  },
] as const;

const leadsMarketplace = [
  {
    id: "lm-1",
    area: "Westmount",
    leadType: "Buyer",
    score: "92",
    price: "$275",
  },
  {
    id: "lm-2",
    area: "Downtown Montréal",
    leadType: "Investor",
    score: "88",
    price: "$275",
  },
  {
    id: "lm-3",
    area: "Laval-sur-le-Lac",
    leadType: "Seller",
    score: "84",
    price: "$275",
  },
] as const;

const tasks = [
  "Follow up with Adam Chen on financing stage.",
  "Confirm visit time for Nora Haddad.",
  "Prepare offer summary for James Carter.",
] as const;

const STAGE_BADGE: Record<string, string> = {
  "New Lead": "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
  Qualified: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  "Visit Scheduled": "border-purple-500/30 bg-purple-500/10 text-purple-300",
  Offer: "border-green-500/30 bg-green-500/10 text-green-300",
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

function StageBadge({ stage }: { stage: string }) {
  const cls = STAGE_BADGE[stage] ?? "border-white/10 bg-white/5 text-white/70";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${cls}`}>{stage}</span>
  );
}

function PipelineRow({
  name,
  stage,
  property,
  value,
  openHref,
  contactHref,
}: {
  name: string;
  stage: string;
  property: string;
  value: string;
  openHref: string;
  contactHref: string;
}) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-white/8 bg-[#0B0B0B] px-5 py-4 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto] lg:items-center">
      <div>
        <h4 className="font-medium text-white">{name}</h4>
        <p className="mt-1 text-sm text-white/50">{property}</p>
      </div>

      <div>
        <StageBadge stage={stage} />
      </div>

      <div className="text-sm text-white/65">{value}</div>

      <Link
        href={openHref}
        className="inline-flex justify-center rounded-full border border-[#D4AF37]/35 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
      >
        Open
      </Link>

      <Link
        href={contactHref}
        className="inline-flex justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
      >
        Contact
      </Link>
    </div>
  );
}

function LeadMarketCard({
  area,
  leadType,
  score,
  price,
  unlockHref,
}: {
  area: string;
  leadType: string;
  score: string;
  price: string;
  unlockHref: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-medium text-white">{area}</h4>
          <p className="mt-2 text-sm text-white/50">{leadType} Lead</p>
        </div>
        <div className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">
          Score {score}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-lg font-semibold text-[#D4AF37]">{price}</div>
        <Link
          href={unlockHref}
          className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black hover:brightness-110"
        >
          Unlock
        </Link>
      </div>
    </div>
  );
}

type Props = {
  locale: string;
  country: string;
};

export function BrokerHubLuxuryShell({ locale, country }: Props) {
  const base = `/${locale}/${country}`;
  const classicHref = `${base}/dashboard/broker?classic=1`;

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-xs text-white/45 sm:text-start">
          Broker command center (sample pipeline).{" "}
          <Link href={classicHref} className="text-[#D4AF37] underline-offset-4 hover:underline">
            Open classic workspace
          </Link>
        </p>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Broker Hub</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              High-performance deal flow.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Manage leads, clients, follow-ups, and closings through a premium broker workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`${base}/dashboard/broker/crm`}
              className="rounded-full border border-[#D4AF37]/45 px-5 py-3 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Open CRM
            </Link>
            <Link
              href={`${base}/dashboard/broker/intake`}
              className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
            >
              View leads
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="New leads" value="14" sub="This week" />
          <StatCard label="Active clients" value="31" sub="Across all stages" />
          <StatCard label="Pipeline value" value="$9.03M" sub="Open opportunities" />
          <StatCard label="Conversion" value="22%" sub="Lead to qualified" />
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-white">Client pipeline</h2>
              <Link href={`${base}/dashboard/broker/crm`} className="text-sm text-[#D4AF37] hover:underline">
                Full pipeline
              </Link>
            </div>

            <div className="space-y-4">
              {pipeline.map((item) => (
                <PipelineRow
                  key={item.id}
                  name={item.name}
                  stage={item.stage}
                  property={item.property}
                  value={item.value}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Priority tasks</div>
              <div className="mt-5 space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/70"
                  >
                    {task}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Commission snapshot</div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Closed this month</span>
                  <span className="text-white">$48,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Projected</span>
                  <span className="text-white">$112,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Best territory</span>
                  <span className="text-[#D4AF37]">Westmount</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium text-white">Lead Marketplace</h2>
            <Link
              href={`${base}/get-leads`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
            >
              Filter Territory
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {leadsMarketplace.map((lead) => (
              <LeadMarketCard
                key={lead.id}
                area={lead.area}
                leadType={lead.leadType}
                score={lead.score}
                price={lead.price}
                unlockHref={`${base}/get-leads`}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
