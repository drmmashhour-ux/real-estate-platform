import { createPaymentPlatform } from "./infrastructure/createPaymentPlatform.js";
import { createPosHttpServer } from "./domain/pos/posHttpApi.js";

export function createApp() {
  const platform = createPaymentPlatform(process.env["PAYMENT_PLATFORM_CURRENCY"] ?? "USD");
  return {
    platform,
    server: createPosHttpServer(platform.pos),
  };
}
