import { createServer, type ServerResponse } from "node:http";
import { createBrandIdentity, mockPosProducts, renderPosScaffold } from "@merchant-payments/platform";
import { assertSafeRuntimeConfig, createCorrelationId, createHealth, StructuredLogger } from "@nexora/shared-types";

const environment = assertSafeRuntimeConfig();
const logger = new StructuredLogger({ service: "pos", environment });

export const server = createServer((req, res) => {
  const correlationId = req.headers["x-correlation-id"]?.toString() ?? createCorrelationId();
  logger.info(correlationId, "request.received", { method: req.method, url: req.url });
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, createHealth("pos", environment));
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(
    renderPosScaffold(
      { merchantId: "mock_merchant", products: mockPosProducts, checkoutStatus: "idle" },
      createBrandIdentity(),
    ),
  );
});

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

if (process.env["NODE_ENV"] !== "test") {
  server.listen(Number(process.env["PORT"] ?? 4002), () => {
    logger.info(createCorrelationId(), "service.started", { port: process.env["PORT"] ?? 4002 });
  });
}
