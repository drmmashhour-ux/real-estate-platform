import { SyriaStubPaymentProvider } from "./provider_stub.js";
import type { ProviderHealth } from "./types.js";
import { nowIso } from "../common/types.js";

export class SyriaChamCashStubProvider extends SyriaStubPaymentProvider {
  readonly code = "provider_chamcash_stub";

  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: this.code,
      status: "disabled",
      liveMode: false,
      checkedAt: nowIso(),
      message: "Cham Cash integration is not connected; this stub is for contract readiness only.",
    };
  }
}
