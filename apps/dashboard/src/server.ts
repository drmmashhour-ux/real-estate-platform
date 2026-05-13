import { createServer, type ServerResponse } from "node:http";
import { createBrandIdentity, createDashboardReadModel, renderOverviewPage } from "@merchant-payments/platform";
import { assertSafeRuntimeConfig, createCorrelationId, createHealth, StructuredLogger } from "@nexora/shared-types";

const environment = assertSafeRuntimeConfig();
const logger = new StructuredLogger({ service: "dashboard", environment });

export const server = createServer((req, res) => {
  const correlationId = req.headers["x-correlation-id"]?.toString() ?? createCorrelationId();
  logger.info(correlationId, "request.received", { method: req.method, url: req.url });
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, createHealth("dashboard", environment));
  }
  const brand = createBrandIdentity();
  const readModel = createDashboardReadModel({
    merchantId: "mock_merchant",
    merchantName: "Nexora Demo Merchant",
    transactions: [],
    settlements: [],
    feeBalanceMinor: 0,
  });
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(renderOverviewPage(readModel, brand));
});

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

if (process.env["NODE_ENV"] !== "test") {
  server.listen(Number(process.env["PORT"] ?? 4001), () => {
    logger.info(createCorrelationId(), "service.started", { port: process.env["PORT"] ?? 4001 });
  });
}
