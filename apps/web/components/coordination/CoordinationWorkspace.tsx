"use client";

import { useCallback, useState } from "react";
import { COORDINATION_DISCLAIMERS } from "@/modules/document-requests/request-explainer";
import { RequestBoard } from "./RequestBoard";
import { BankCoordinationPanel } from "./BankCoordinationPanel";
import { NotaryCoordinationPanel } from "./NotaryCoordinationPanel";
import { RequestAutopilotPanel } from "./RequestAutopilotPanel";
import { CommunicationDraftPanel } from "./CommunicationDraftPanel";
import { ClosingBlockersPanel } from "./ClosingBlockersPanel";

type Flags = {
  documentRequestAutopilotV1: boolean;
  bankCoordinationV1: boolean;
  notaryCoordinationHubV1: boolean;
  requestCommunicationsV1: boolean;
  closingRequestValidationV1: boolean;
  liveOutboundEmail: boolean;
};

export function CoordinationWorkspace({ dealId, flags }: { dealId: string; flags: Flags }) {
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">Broker coordination workspace</p>
        <p className="mt-1 text-xs text-amber-100/70">{COORDINATION_DISCLAIMERS.notLender}</p>
        <p className="mt-1 text-xs text-amber-100/70">{COORDINATION_DISCLAIMERS.notNotary}</p>
        <p className="mt-1 text-xs text-amber-100/70">{COORDINATION_DISCLAIMERS.brokerControlled}</p>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <ClosingBlockersPanel dealId={dealId} flags={flags as Record<string, boolean>} onError={setError} />

      {flags.documentRequestAutopilotV1 ? (
        <RequestAutopilotPanel dealId={dealId} onRefresh={reload} onError={setError} />
      ) : (
        <p className="text-xs text-slate-500">Autopilot suggestions disabled (feature flag).</p>
      )}

      <RequestBoard key={refreshKey} dealId={dealId} flags={flags} onError={setError} />

      <div className="grid gap-6 lg:grid-cols-2">
        {flags.bankCoordinationV1 ? (
          <BankCoordinationPanel dealId={dealId} onError={setError} />
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
            Bank coordination module disabled.
          </div>
        )}
        {flags.notaryCoordinationHubV1 ? (
          <NotaryCoordinationPanel dealId={dealId} onError={setError} />
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
            Notary coordination module disabled.
          </div>
        )}
      </div>

      {flags.requestCommunicationsV1 ? (
        <CommunicationDraftPanel dealId={dealId} onError={setError} />
      ) : null}
    </div>
  );
}
