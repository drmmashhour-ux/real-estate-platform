import type { MapFormResult } from "../oaciq-mapper/mapper.types";
import { brokerManualExportProvider } from "./adapters/broker-manual-export.adapter";
import { nullExecutionProvider } from "./adapters/null-provider.adapter";
import { pdfExportPlaceholderProvider } from "./adapters/pdf-export-placeholder.adapter";
import { logBridgeAudit } from "./bridge-audit.service";
import { buildExportPayload } from "./export-payload.builder";
import type { ExecutionBridgeExportPayload, ExecutionReadinessStatus } from "./execution-bridge.types";
import type { ExecutionProvider } from "./execution-provider.interface";
import { createOfficialFormSession, getOfficialFormSession } from "./official-form-session.service";

export type BridgeProviderMode = "null" | "pdf_placeholder" | "broker_manual";

function resolveProvider(mode: BridgeProviderMode): ExecutionProvider {
  switch (mode) {
    case "pdf_placeholder":
      return pdfExportPlaceholderProvider;
    case "broker_manual":
      return brokerManualExportProvider;
    default:
      return nullExecutionProvider;
  }
}

export async function createBridgeSession(input: {
  dealId: string;
  formKey: string;
  actorUserId: string | null;
}): Promise<{ sessionId: string; executionReadinessStatus: ExecutionReadinessStatus }> {
  const session = createOfficialFormSession({ dealId: input.dealId, formKey: input.formKey });
  const audit = await logBridgeAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "oaciq_session_created",
    payload: { sessionId: session.sessionId, formKey: session.formKey },
  });
  void audit;
  return { sessionId: session.sessionId, executionReadinessStatus: session.executionReadinessStatus };
}

export async function exportThroughBridge(input: {
  dealId: string;
  formKey: string;
  map: MapFormResult;
  actorUserId: string | null;
  providerMode: BridgeProviderMode;
  brokerApprovalState: ExecutionBridgeExportPayload["brokerApprovalState"];
  sourceDocumentRefs: string[];
  providerConnected: boolean;
}): Promise<{ payload: ExecutionBridgeExportPayload; providerMessage: string }> {
  const payload = buildExportPayload({
    dealId: input.dealId,
    formKey: input.formKey,
    map: input.map,
    brokerApprovalState: input.brokerApprovalState,
    sourceDocumentRefs: input.sourceDocumentRefs,
    providerConnected: input.providerConnected,
  });
  const audit = await logBridgeAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "oaciq_export_built",
    payload: {
      formKey: input.formKey,
      readiness: payload.executionReadinessStatus,
      missingCount: payload.missingFields.length,
    },
  });
  payload.auditRef = audit.id;
  const provider = resolveProvider(input.providerMode);
  const result = await provider.submitPayload(payload);
  await logBridgeAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "oaciq_provider_submit",
    payload: { providerId: provider.providerId, message: result.message },
  });
  return { payload, providerMessage: result.message };
}

export function getBridgeSession(sessionId: string) {
  return getOfficialFormSession(sessionId);
}
