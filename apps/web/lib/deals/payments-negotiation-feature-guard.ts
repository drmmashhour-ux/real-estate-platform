import { lecipmPaymentsNegotiationFlags } from "@/config/feature-flags";

export function requireTrustWorkflowV1(): Response | null {
  if (!lecipmPaymentsNegotiationFlags.trustWorkflowV1) {
    return Response.json({ error: "Trust workflow disabled" }, { status: 403 });
  }
  return null;
}

export function requireDealLedgerV1(): Response | null {
  if (!lecipmPaymentsNegotiationFlags.dealLedgerV1) {
    return Response.json({ error: "Deal ledger disabled" }, { status: 403 });
  }
  return null;
}

export function requireNegotiationCopilotV1(): Response | null {
  if (!lecipmPaymentsNegotiationFlags.negotiationCopilotV1) {
    return Response.json({ error: "Negotiation copilot disabled" }, { status: 403 });
  }
  return null;
}

export function requirePaymentAutomationV1(): Response | null {
  if (!lecipmPaymentsNegotiationFlags.paymentAutomationV1) {
    return Response.json({ error: "Payment automation disabled" }, { status: 403 });
  }
  return null;
}
