import type { OverdueBlockersGroup, WorkloadSummaryGroup } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerKPICard } from "./BrokerKPICard";

export function BrokerWorkloadCard({
  workload,
  overdue,
}: {
  workload: WorkloadSummaryGroup;
  overdue: OverdueBlockersGroup;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <BrokerKPICard label="Lead broker roles" value={workload.assignedDealsAsLead} />
      <BrokerKPICard label="Pending reviews (est.)" value={workload.pendingReviewItems} />
      <BrokerKPICard label="Active assignments" value={workload.activeTeamAssignments} />
      <BrokerKPICard label="Tasks past due" value={overdue.openTasksPastDue} />
      <BrokerKPICard label="Milestones (3d)" value={overdue.milestonesDueSoon} />
      <BrokerKPICard label="Requests overdue" value={overdue.dealRequestsPastDue} />
    </div>
  );
}
