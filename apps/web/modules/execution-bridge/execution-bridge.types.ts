/**
 * Draft / specimen intelligence vs official execution — statuses must never imply publisher-authorized execution unless a real provider is connected.
 */

export type ExecutionReadinessStatus =
  | "draft_only"
  | "ready_for_manual_transfer"
  | "provider_connected"
  | "assisted_execution";

export type BrokerApprovalState = "draft" | "review_pending" | "approved_for_export";

export type ExecutionBridgeExportPayload = {
  officialTargetFormCode: string;
  dealId: string;
  mappedFields: Record<string, unknown>;
  missingFields: string[];
  warnings: string[];
  brokerApprovalState: BrokerApprovalState;
  sourceDocumentRefs: string[];
  executionReadinessStatus: ExecutionReadinessStatus;
  /** Fixed specimen disclaimer — UI must surface alongside previews. */
  specimenDisclaimer: "Specimen-oriented mapping — not an official executable form output.";
  auditRef?: string;
};

export type OfficialFormSession = {
  sessionId: string;
  dealId: string;
  formKey: string;
  createdAt: string;
  executionReadinessStatus: ExecutionReadinessStatus;
};
