import { FinancialError } from "../common/errors.js";
import {
  isSyriaFinancialFeatureEnabled,
  type SyriaFinancialFeatureFlags,
} from "../common/featureFlags.js";
import { SyriaChamCashStubProvider } from "./provider_chamcash_stub.js";
import { SyriaQnbStubProvider } from "./provider_qnb_stub.js";
import { SyriaStubPaymentProvider } from "./provider_stub.js";
import type { SyriaPaymentProvider } from "./types.js";
import type { SyriaProviderCode } from "../common/types.js";

export type { SyriaPaymentProvider } from "./types.js";
export { SyriaStubPaymentProvider } from "./provider_stub.js";
export { SyriaQnbStubProvider } from "./provider_qnb_stub.js";
export { SyriaChamCashStubProvider } from "./provider_chamcash_stub.js";

export function getSyriaPaymentProvider(
  providerCode: SyriaProviderCode,
  flags?: SyriaFinancialFeatureFlags,
): SyriaPaymentProvider {
  if (providerCode === "provider_qnb_stub") {
    if (!isSyriaFinancialFeatureEnabled("FEATURE_SYRIA_PROVIDER_QNB", flags)) {
      throw new FinancialError("FEATURE_DISABLED", "QNB Syria provider is disabled by feature flag.", 403);
    }
    return new SyriaQnbStubProvider();
  }

  if (providerCode === "provider_chamcash_stub") {
    if (!isSyriaFinancialFeatureEnabled("FEATURE_SYRIA_PROVIDER_CHAMCASH", flags)) {
      throw new FinancialError("FEATURE_DISABLED", "Cham Cash provider is disabled by feature flag.", 403);
    }
    return new SyriaChamCashStubProvider();
  }

  return new SyriaStubPaymentProvider();
}
