export function brokerKpiDisclaimer(): string {
  return (
    "Indicators are computed from internal platform activity and are operational aids only. " +
    "They are not performance guarantees, regulatory metrics, or substitutes for your brokerage’s own records and supervision."
  );
}

export function brokerKpiMetricNotes(): Record<string, string> {
  return {
    avgResponseTime:
      "Estimated from the time between lead creation and the first CRM interaction logged by you (or your team) on that lead.",
    counterOfferRate: "Share of negotiation proposals in the period that were counter-offers, for your deals.",
    offerToClose: "Average days from deal record creation to closed status, for deals closed in the window (approximation).",
    paymentLag: "Based on payment ledger and confirmation timestamps where recorded.",
    signatureTime: "Completed e-signature sessions only; median time from session start to last signer.",
  };
}
