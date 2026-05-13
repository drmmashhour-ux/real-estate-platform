import { createCorrelationId, StructuredLogger, assertSafeRuntimeConfig } from "@nexora/shared-types";
import { createApiGatewayApp } from "./app.js";
import type { Application } from "express";

const environment = assertSafeRuntimeConfig();
const logger = new StructuredLogger({ service: "api-gateway", environment });
export const app: Application = createApiGatewayApp();

if (process.env["NODE_ENV"] !== "test") {
  app.listen(Number(process.env["PORT"] ?? 4000), () => {
    logger.info(createCorrelationId(), "service.started", { port: process.env["PORT"] ?? 4000 });
  });
}
