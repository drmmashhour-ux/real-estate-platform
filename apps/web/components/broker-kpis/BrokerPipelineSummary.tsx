import type { DealKpiGroup } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerKPICard } from "./BrokerKPICard";

export function BrokerPipelineSummary({ deal }: { deal: DealKpiGroup }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <BrokerKPICard label="Active deals" value={deal.activeDeals} />
      <BrokerKPICard label="Drafting / contract" value={deal.dealsInDrafting} hint="AI Contract Engine workflow states (assistive)." />
      <BrokerKPICard label="Awaiting signature" value={deal.dealsAwaitingSignature} />
      <BrokerKPICard label="Conditions pending" value={deal.dealsAwaitingConditions} />
      <BrokerKPICard label="Closing-ready" value={deal.dealsClosingReady} />
      <BrokerKPICard label="Closed (window)" value={deal.dealsClosedInWindow} />
    </div>
  );
}
