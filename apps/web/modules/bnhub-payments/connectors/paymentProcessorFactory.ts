import type { BnhubProcessorId, MarketplacePaymentProcessorAdapter } from "@/modules/bnhub-payments/connectors/paymentProcessorTypes";
import { StripeConnectAdapter } from "@/modules/bnhub-payments/connectors/stripeConnectAdapter";

const stripeAdapter = new StripeConnectAdapter();

export function getMarketplacePaymentProcessor(
  processor: BnhubProcessorId = "stripe"
): MarketplacePaymentProcessorAdapter {
  switch (processor) {
    case "stripe":
      return stripeAdapter;
    default:
      return stripeAdapter;
  }
}
