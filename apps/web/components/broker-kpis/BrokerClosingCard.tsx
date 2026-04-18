import type { ClosingKpiGroup, CoordinationKpiGroup, NegotiationKpiGroup } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerKPICard } from "./BrokerKPICard";

export function BrokerClosingCard({
  negotiation,
  closing,
  coordination,
}: {
  negotiation: NegotiationKpiGroup;
  closing: ClosingKpiGroup;
  coordination: CoordinationKpiGroup;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <BrokerKPICard
        label="Counter-offer rate"
        value={negotiation.counterOfferRate !== null ? `${Math.round(negotiation.counterOfferRate * 100)}%` : "—"}
        hint={`${negotiation.counterOffersInWindow} / ${negotiation.proposalsInWindow} proposals`}
      />
      <BrokerKPICard
        label="Avg days to close"
        value={closing.offerToCloseDaysAvg ?? "—"}
        hint={`Sample ${closing.offerToCloseSampleSize} deals`}
      />
      <BrokerKPICard
        label="Close vs cancel (window)"
        value={closing.closingConversionRate !== null ? `${Math.round(closing.closingConversionRate * 100)}%` : "—"}
      />
      <BrokerKPICard
        label="Doc requests overdue"
        value={coordination.documentRequestsOverdue}
      />
      <BrokerKPICard
        label="Signature median (hrs)"
        value={coordination.signatureCompletionHoursMedian ?? "—"}
        hint={`${coordination.signatureSessionsCompleted} completed sessions`}
      />
      <BrokerKPICard
        label="Payment confirm lag (hrs)"
        value={coordination.paymentConfirmationLagHoursAvg ?? "—"}
        hint={`${coordination.paymentConfirmationSamples} samples`}
      />
    </div>
  );
}
