import type { ExecutionProvider } from "../execution-provider.interface";
import type { ExecutionBridgeExportPayload } from "../execution-bridge.types";

/** Broker copies mapped fields into official broker-authorized environment manually. */
export const brokerManualExportProvider: ExecutionProvider = {
  providerId: "broker_manual",
  async submitPayload(payload: ExecutionBridgeExportPayload) {
    return {
      message: `Manual transfer path — broker enters data in authorized forms (${payload.executionReadinessStatus}).`,
    };
  },
};
