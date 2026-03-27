"use client";

import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

export function BrokerLeadSummaryAiCard(props: {
  activeClients: string;
  newLeads: string;
  closedDeals: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
      <HubAiInsightWidget
        hub="broker"
        feature="lead_summary"
        intent="summary"
        title="AI Lead Priority"
        context={{ ...props, surface: "broker_dashboard" }}
        accent="#34d399"
      />
    </div>
  );
}
