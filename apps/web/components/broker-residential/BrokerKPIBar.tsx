import type { ResidentialKpiSnapshot } from "@/modules/broker-residential-copilot/broker-residential-copilot.types";

export function BrokerKPIBar({ kpis }: { kpis: ResidentialKpiSnapshot }) {
  const items: { label: string; value: number; hint?: string }[] = [
    { label: "Active deals", value: kpis.activeDeals },
    { label: "Review load (docs + copilot)", value: kpis.dealsAwaitingReview },
    { label: "Drafts", value: kpis.documentsDraft },
    { label: "Broker review (docs)", value: kpis.documentsBrokerReview },
    { label: "Deadlines (3d)", value: kpis.urgentDeadlines },
    { label: "Priority CRM", value: kpis.highPriorityLeads },
    { label: "Copilot pending", value: kpis.copilotPending },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((x) => (
        <div
          key={x.label}
          className="rounded-2xl border border-ds-border bg-ds-card/80 px-4 py-3 shadow-ds-soft"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-secondary">{x.label}</p>
          <p className="mt-1 font-serif text-2xl tabular-nums text-ds-gold">{x.value}</p>
        </div>
      ))}
    </div>
  );
}
