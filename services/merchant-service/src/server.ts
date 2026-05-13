import { createServer, type ServerResponse } from "node:http";
import { assertSafeRuntimeConfig, createCorrelationId, createHealth, StructuredLogger } from "@nexora/shared-types";

const environment = assertSafeRuntimeConfig();
const logger = new StructuredLogger({ service: "merchant-service", environment });

export const server = createServer((req, res) => {
  const correlationId = req.headers["x-correlation-id"]?.toString() ?? createCorrelationId();
  logger.info(correlationId, "request.received", { method: req.method, url: req.url });
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, createHealth("merchant-service", environment));
  }
  return json(res, 404, { error: "not_found", correlationId });
});

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

if (process.env["NODE_ENV"] !== "test") {
  server.listen(Number(process.env["PORT"] ?? 4102), () => {
    logger.info(createCorrelationId(), "service.started", { port: process.env["PORT"] ?? 4102 });
  });
}
