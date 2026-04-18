import type { ExecutionKpiGroup } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerKPICard } from "./BrokerKPICard";

export function BrokerExecutionHealthCard({ execution }: { execution: ExecutionKpiGroup }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <BrokerKPICard label="Documents in draft" value={execution.documentsInDraft} />
      <BrokerKPICard label="Broker review queue" value={execution.documentsBrokerReview} />
      <BrokerKPICard label="Execution pipeline — broker review" value={execution.executionPipelineBrokerReview} />
      <BrokerKPICard label="Copilot pending" value={execution.copilotSuggestionsPending} />
    </div>
  );
}
