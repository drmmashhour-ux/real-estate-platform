import type { ExecutionProvider } from "../execution-provider.interface";
import type { ExecutionBridgeExportPayload } from "../execution-bridge.types";

export const nullExecutionProvider: ExecutionProvider = {
  providerId: "null",
  async submitPayload(_payload: ExecutionBridgeExportPayload) {
    return { message: "Null provider — no external execution (by design)." };
  },
};
