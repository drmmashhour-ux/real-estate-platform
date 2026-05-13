import { createPaymentPlatform } from "./infrastructure/createPaymentPlatform.js";

export function createApp() {
  const platform = createPaymentPlatform(process.env["PAYMENT_PLATFORM_CURRENCY"] ?? "USD");
  return {
    platform,
    server: platform.product.apiGateway,
  };
}
