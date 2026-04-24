"use client";

import { useState } from "react";
import { DealCopilotPanel } from "@/components/copilot/DealCopilotPanel";
import { DocumentList } from "@/components/documents/DocumentList";
import { SignatureNotaryClosingPanels } from "@/components/deals/SignatureNotaryClosingPanels";
import { DealPaymentsHub } from "@/components/payments-ops/DealPaymentsHub";
import { NegotiationWorkspace } from "@/components/negotiation/NegotiationWorkspace";
import { BrokerQuickSignPanel } from "@/components/broker/BrokerQuickSignPanel";
import { BrokerApprovalStatusChip } from "@/components/deals/BrokerApprovalStatusChip";
import { DealScoringInsightPanel } from "@/components/deals/DealScoringInsightPanel";

type Props = {
  dealId: string;
  canMutate: boolean;
  copilotEnabled: boolean;
  showSignaturePanels: boolean;
  showRealProviderSend: boolean;
  showNotaryPanels: boolean;
  showClosingPanels: boolean;
  showPaymentsHub: boolean;
  showNegotiationHub: boolean;
  includeDealLedger: boolean;
  quickSign?: { displayName: string; email: string } | null;
  dealScoringRefresh?: boolean;
  showDealScoring?: boolean;
  showBrokerApprovalStatus?: boolean;
};

export function DealExecutionWorkspace({
  dealId,
  canMutate,
  copilotEnabled,
  showSignaturePanels,
  showRealProviderSend,
  showNotaryPanels,
  showClosingPanels,
  showPaymentsHub,
  showNegotiationHub,
  includeDealLedger,
  quickSign,
  dealScoringRefresh = false,
  showDealScoring = true,
  showBrokerApprovalStatus = true,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {showBrokerApprovalStatus ?
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Broker approval</span>
          <BrokerApprovalStatusChip dealId={dealId} />
        </div>
      : null}

      {showDealScoring ? <DealScoringInsightPanel dealId={dealId} allowRefresh={dealScoringRefresh} /> : null}

      {quickSign ?
        <BrokerQuickSignPanel dealId={dealId} brokerDisplayName={quickSign.displayName} brokerEmail={quickSign.email} />
      : null}

      <section className="rounded-2xl border border-amber-500/20 bg-black/60 p-6 shadow-xl shadow-black/40">
        <h2 className="font-serif text-xl tracking-tight text-amber-100">Broker obligations</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed text-amber-100/75">
          <li>LECIPM does not replace the broker. Official OACIQ forms and brokerage instructions prevail.</li>
          <li>All assistance below is draft / review support — not a filed legal instrument.</li>
          <li>High-impact actions require your confirmation; nothing is silently submitted to registries.</li>
        </ul>
      </section>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      <DealCopilotPanel dealId={dealId} canMutate={canMutate} enabled={copilotEnabled} onError={setError} />

      <SignatureNotaryClosingPanels
        dealId={dealId}
        canMutate={canMutate}
        showSignature={showSignaturePanels}
        showRealProviderSend={showRealProviderSend}
        showNotary={showNotaryPanels}
        showClosing={showClosingPanels}
      />

      {showPaymentsHub ? <DealPaymentsHub dealId={dealId} includeLedger={includeDealLedger} /> : null}
      {showNegotiationHub ? <NegotiationWorkspace dealId={dealId} /> : null}

      <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
        <h2 className="font-serif text-lg text-amber-50">Documents &amp; structured drafts</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Rows may represent structured assistance without an uploaded PDF — upload official forms separately.
        </p>
        <div className="mt-4">
          <DocumentList dealId={dealId} canMutate={canMutate} />
        </div>
      </section>
    </div>
  );
}
