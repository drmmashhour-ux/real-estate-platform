import { assertSyriaFinancialFeatureEnabled } from "../featureFlags.js";
import { assertSyriaFinancialReadOnlyMode } from "../safetyGuard.js";
import { SyriaChamCashStubPaymentProvider } from "./providerChamcashStub.js";
import { SyriaQnbStubPaymentProvider } from "./providerQnbStub.js";
import { SyriaStubPaymentProvider } from "./providerStub.js";
import {
  syriaPaymentProviderIdSchema,
  type SyriaPaymentProvider,
  type SyriaPaymentProviderId,
} from "./types.js";

const providers: Record<SyriaPaymentProviderId, SyriaPaymentProvider> = {
  provider_stub: new SyriaStubPaymentProvider(),
  provider_qnb_stub: new SyriaQnbStubPaymentProvider(),
  provider_chamcash_stub: new SyriaChamCashStubPaymentProvider(),
};

export function getSyriaPaymentProvider(providerId: SyriaPaymentProviderId): SyriaPaymentProvider {
  assertSyriaFinancialReadOnlyMode();
  const parsedProviderId = syriaPaymentProviderIdSchema.parse(providerId);
  return providers[parsedProviderId];
}

export function getFlagProtectedSyriaPaymentProvider(
  providerId: SyriaPaymentProviderId,
): SyriaPaymentProvider {
  if (providerId === "provider_qnb_stub") {
    assertSyriaFinancialFeatureEnabled("FEATURE_SYRIA_PROVIDER_QNB");
  }
  if (providerId === "provider_chamcash_stub") {
    assertSyriaFinancialFeatureEnabled("FEATURE_SYRIA_PROVIDER_CHAMCASH");
  }
  return getSyriaPaymentProvider(providerId);
}
