import type { ExecutionBridgeExportPayload } from "./execution-bridge.types";

export type ProviderSubmitResult = {
  externalRef?: string;
  message: string;
};

export interface ExecutionProvider {
  readonly providerId: string;
  submitPayload(payload: ExecutionBridgeExportPayload): Promise<ProviderSubmitResult>;
}
