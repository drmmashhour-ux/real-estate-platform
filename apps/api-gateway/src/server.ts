import { createServer, type ServerResponse } from "node:http";
import { createProductizedPlatform } from "@merchant-payments/platform";
import {
  assertSafeRuntimeConfig,
  createCorrelationId,
  createHealth,
  fail,
  ok,
  StructuredLogger,
} from "@nexora/shared-types";

const environment = assertSafeRuntimeConfig();
const logger = new StructuredLogger({ service: "api-gateway", environment });
const platform = createProductizedPlatform(process.env["NEXORA_CURRENCY"] ?? "USD");
const admin = platform.product.auth.createUser({ email: "admin@nexora.local", role: "admin" });
const adminSession = platform.product.auth.createSession(admin.id);

export const server = createServer(async (req, res) => {
  const correlationId = req.headers["x-correlation-id"]?.toString() ?? createCorrelationId();
  logger.info(correlationId, "request.received", { method: req.method, url: req.url });
  try {
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, ok(correlationId, createHealth("api-gateway", environment)));
    }
    if (req.method === "GET" && req.url === "/session/mock-admin") {
      return send(res, 200, ok(correlationId, { token: adminSession.token }));
    }
    return send(res, 404, fail(correlationId, "NOT_FOUND", "Route not found."));
  } catch (error) {
    logger.error(correlationId, "request.failed", { error: error instanceof Error ? error.message : "unknown" });
    return send(res, 500, fail(correlationId, "INTERNAL_ERROR", "Request failed."));
  }
});

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

if (process.env["NODE_ENV"] !== "test") {
  server.listen(Number(process.env["PORT"] ?? 4000), () => {
    logger.info(createCorrelationId(), "service.started", { port: process.env["PORT"] ?? 4000 });
  });
}
