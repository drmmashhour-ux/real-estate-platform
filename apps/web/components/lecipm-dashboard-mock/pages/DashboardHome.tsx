import { MockBadge, MockButton, MockCard, MockKpi } from "@/components/lecipm-dashboard-mock/mock-ui";

export function DashboardHome() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ds-text-secondary">Pipeline health · intelligence · next actions</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MockKpi label="Leads" value="128" hint="+12% vs last week" />
        <MockKpi label="Deals" value="24" hint="8 in negotiation" />
        <MockKpi label="Conversion %" value="18.4%" hint="Lead → qualified" />
        <MockKpi label="Revenue" value="$842k" hint="Trailing 90d (mock)" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <MockCard className="hover:border-ds-gold/30 hover:shadow-[0_0_36px_rgba(212,175,55,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Deal Intelligence</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Active pipeline signals</h2>
            </div>
            <MockBadge tone="gold">Live</MockBadge>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-ds-border bg-black/40 p-4">
              <dt className="text-[11px] uppercase tracking-wide text-ds-text-secondary">dealScore</dt>
              <dd className="mt-1 text-2xl font-bold text-ds-gold">82</dd>
              <dd className="mt-1 text-xs text-ds-text-secondary">Weighted quality</dd>
            </div>
            <div className="rounded-lg border border-ds-border bg-black/40 p-4">
              <dt className="text-[11px] uppercase tracking-wide text-ds-text-secondary">closeProbability</dt>
              <dd className="mt-1 text-2xl font-bold text-white">64%</dd>
              <dd className="mt-1 text-xs text-ds-text-secondary">Model estimate</dd>
            </div>
            <div className="rounded-lg border border-ds-border bg-black/40 p-4">
              <dt className="text-[11px] uppercase tracking-wide text-ds-text-secondary">riskLevel</dt>
              <dd className="mt-1 text-2xl font-bold text-amber-200/90">Low</dd>
              <dd className="mt-1 text-xs text-ds-text-secondary">Compliance + docs</dd>
            </div>
          </dl>
        </MockCard>

        <MockCard className="hover:border-ds-gold/30 hover:shadow-[0_0_36px_rgba(212,175,55,0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">AI Suggestions</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Recommended moves</h2>
          <ul className="mt-5 space-y-3">
            <SuggestionRow title="Follow up now" body="Duplex St-Henri — buyer engaged 48h ago." />
            <SuggestionRow title="Adjust price" body="Comp set moved −3.1%; consider −1.5% to stay competitive." />
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <MockButton>Apply suggestion</MockButton>
            <MockButton variant="ghost">Dismiss</MockButton>
          </div>
        </MockCard>
      </section>
    </div>
  );
}

function SuggestionRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-3 rounded-lg border border-ds-border bg-ds-bg p-3 transition hover:border-ds-gold/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-ds-gold shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
      <div>
        <p className="font-semibold text-ds-gold">{title}</p>
        <p className="mt-0.5 text-sm text-ds-text-secondary">{body}</p>
      </div>
    </li>
  );
}
