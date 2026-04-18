import type { MapFormResult } from "../oaciq-mapper/mapper.types";
import type { ExecutionBridgeExportPayload, ExecutionReadinessStatus } from "./execution-bridge.types";

const SPECIMEN: ExecutionBridgeExportPayload["specimenDisclaimer"] =
  "Specimen-oriented mapping — not an official executable form output.";

export function buildExportPayload(input: {
  dealId: string;
  formKey: string;
  map: MapFormResult;
  brokerApprovalState: ExecutionBridgeExportPayload["brokerApprovalState"];
  sourceDocumentRefs: string[];
  providerConnected: boolean;
}): ExecutionBridgeExportPayload {
  const missingFields = input.map.missingRequiredKeys;
  const warnings = [...input.map.warnings];
  let executionReadinessStatus: ExecutionReadinessStatus = "draft_only";
  if (input.providerConnected) {
    executionReadinessStatus = "provider_connected";
  } else if (missingFields.length === 0 && input.brokerApprovalState === "approved_for_export") {
    executionReadinessStatus = "ready_for_manual_transfer";
  }

  return {
    officialTargetFormCode: input.formKey.toUpperCase(),
    dealId: input.dealId,
    mappedFields: input.map.mappedFields,
    missingFields,
    warnings,
    brokerApprovalState: input.brokerApprovalState,
    sourceDocumentRefs: input.sourceDocumentRefs,
    executionReadinessStatus,
    specimenDisclaimer: SPECIMEN,
  };
}
