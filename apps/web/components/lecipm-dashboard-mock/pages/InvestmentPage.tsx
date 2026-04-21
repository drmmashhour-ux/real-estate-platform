import { MockBadge, MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

const OPPS = [
  { name: "Plateau triplex · value-add", roi: "14.2%", risk: "Medium" },
  { name: "Industrial flex · Longueuil", roi: "11.0%", risk: "Low" },
  { name: "Retail strip · tertiary market", roi: "17.8%", risk: "High" },
];

export function InvestmentPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Investment</h1>
        <p className="mt-1 text-sm text-ds-text-secondary">Non-advisory signals · diligence required</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <MockCard className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Top opportunities</p>
          <ul className="mt-4 space-y-4">
            {OPPS.map((o) => (
              <li
                key={o.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ds-border bg-black/40 px-4 py-3 transition hover:border-ds-gold/40 hover:shadow-[0_0_28px_rgba(212,175,55,0.1)]"
              >
                <span className="font-medium text-white">{o.name}</span>
                <span className="flex items-center gap-2">
                  <MockBadge tone="gold">{o.roi} ROI</MockBadge>
                  <RiskPill risk={o.risk} />
                </span>
              </li>
            ))}
          </ul>
        </MockCard>

        <div className="space-y-4">
          <MockCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">ROI %</p>
            <p className="mt-2 text-3xl font-bold text-ds-gold">12.8%</p>
            <p className="mt-1 text-xs text-ds-text-secondary">Blended illustrative across watchlist</p>
          </MockCard>
          <MockCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">risk level</p>
            <p className="mt-2 text-2xl font-bold text-amber-200/95">Medium</p>
            <p className="mt-1 text-xs text-ds-text-secondary">Concentration in value-add multifamily</p>
          </MockCard>
        </div>
      </div>
    </div>
  );
}

function RiskPill({ risk }: { risk: string }) {
  const tone = risk === "Low" ? "muted" : "gold";
  return <MockBadge tone={tone}>{risk} risk</MockBadge>;
}
