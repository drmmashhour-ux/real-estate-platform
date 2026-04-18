import type { ExecutionProvider } from "../execution-provider.interface";
import type { ExecutionBridgeExportPayload } from "../execution-bridge.types";

/** Placeholder for future PDF export — does not produce an official OACIQ form. */
export const pdfExportPlaceholderProvider: ExecutionProvider = {
  providerId: "pdf_export_placeholder",
  async submitPayload(payload: ExecutionBridgeExportPayload) {
    return {
      message: `Placeholder: structured export only (${payload.officialTargetFormCode}) — not publisher PDF execution.`,
    };
  },
};
