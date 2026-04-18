import { dealTransactionFlags, productionPipelineFlags } from "@/config/feature-flags";

export function requireDealExecutionV1(): Response | null {
  if (!dealTransactionFlags.dealExecutionV1) {
    return Response.json({ error: "Deal execution pipeline disabled" }, { status: 403 });
  }
  return null;
}

export function requireSignatureSystemV1(): Response | null {
  if (!dealTransactionFlags.signatureSystemV1) {
    return Response.json({ error: "Signature system disabled" }, { status: 403 });
  }
  return null;
}

export function requireConditionTrackingV1(): Response | null {
  if (!dealTransactionFlags.conditionTrackingV1) {
    return Response.json({ error: "Condition tracking disabled" }, { status: 403 });
  }
  return null;
}

export function requireClientDealViewV1(): Response | null {
  if (!dealTransactionFlags.clientDealViewV1) {
    return Response.json({ error: "Client deal view disabled" }, { status: 403 });
  }
  return null;
}

export function requireNotarySystemV1(): Response | null {
  if (!productionPipelineFlags.notarySystemV1) {
    return Response.json({ error: "Notary coordination disabled" }, { status: 403 });
  }
  return null;
}

export function requireClosingPipelineV1(): Response | null {
  if (!productionPipelineFlags.closingPipelineV1) {
    return Response.json({ error: "Closing pipeline disabled" }, { status: 403 });
  }
  return null;
}

export function requireSignatureRealProvidersV1(): Response | null {
  if (!productionPipelineFlags.signatureRealProvidersV1) {
    return Response.json({ error: "Real signature providers disabled" }, { status: 403 });
  }
  return null;
}
