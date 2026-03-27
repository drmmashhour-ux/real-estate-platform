"use client";

import { HubAiDock } from "./HubAiDock";

export function BrokerHubAiSection(props: { activeClients?: string; newLeads?: string }) {
  return (
    <div className="mt-6">
      <HubAiDock
        hub="broker"
        context={{
          activeClientsLabel: props.activeClients,
          newLeadsLabel: props.newLeads,
        }}
      />
    </div>
  );
}
