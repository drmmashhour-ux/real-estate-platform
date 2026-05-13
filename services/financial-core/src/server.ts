import { createServer, type ServerResponse } from "node:http";
import { assertFinancialSafety, createPaymentPlatform } from "@merchant-payments/platform";
import { assertSafeRuntimeConfig, createCorrelationId, createHealth, StructuredLogger } from "@nexora/shared-types";

const environment = assertSafeRuntimeConfig();
assertFinancialSafety();
const logger = new StructuredLogger({ service: "financial-core", environment });
const core = createPaymentPlatform(process.env["NEXORA_CURRENCY"] ?? "USD");

export const server = createServer((req, res) => {
  const correlationId = req.headers["x-correlation-id"]?.toString() ?? createCorrelationId();
  logger.info(correlationId, "request.received", { method: req.method, url: req.url });
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, {
      ...createHealth("financial-core", environment),
      accounts: Object.keys(core.accounts),
    });
  }
  return json(res, 404, { error: "not_found", correlationId });
});

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

if (process.env["NODE_ENV"] !== "test") {
  server.listen(Number(process.env["PORT"] ?? 4100), () => {
    logger.info(createCorrelationId(), "service.started", { port: process.env["PORT"] ?? 4100 });
  });
}
