import type { LeadKpiGroup } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerKPICard } from "./BrokerKPICard";

export function BrokerFollowupHealthCard({ lead }: { lead: LeadKpiGroup }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <BrokerKPICard label="New leads" value={lead.newLeads} />
      <BrokerKPICard label="Warm" value={lead.warmLeads} />
      <BrokerKPICard label="Hot" value={lead.hotLeads} />
      <BrokerKPICard label="Follow-up overdue" value={lead.followUpOverdue} />
      <BrokerKPICard
        label="Avg response (hrs)"
        value={lead.avgResponseTimeHours ?? "—"}
        hint={`Sample: ${lead.responseSampleSize} leads`}
      />
    </div>
  );
}
