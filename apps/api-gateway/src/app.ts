import express, { type Application, type ErrorRequestHandler, type Request, type Response } from "express";
import { z } from "zod";
import { createProductizedPlatform } from "@merchant-payments/platform";
import {
  assertSafeRuntimeConfig,
  createCorrelationId,
  createHealth,
  fail,
  MetricsCollector,
  ok,
  StructuredLogger,
} from "@nexora/shared-types";

const transactionBodySchema = z.object({
  merchantId: z.string().min(1),
  provider: z.enum(["mock_visa", "mock_mastercard", "mock_bank"]),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  idempotencyKey: z.string().min(8),
});

const merchantBodySchema = z.object({
  displayName: z.string().min(1),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  platformFeeBps: z.number().int().min(0).optional(),
  settlementDelay: z.enum(["T+1", "T+2"]).optional(),
});

export function createApiGatewayApp(): Application {
  const environment = assertSafeRuntimeConfig();
  const logger = new StructuredLogger({ service: "api-gateway", environment });
  const metrics = new MetricsCollector();
  const platform = createProductizedPlatform(process.env["NEXORA_CURRENCY"] ?? "USD");
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    const correlationId = req.headers["x-correlation-id"]?.toString() ?? createCorrelationId();
    res.locals["correlationId"] = correlationId;
    metrics.increment("api.requests");
    logger.info(correlationId, "request.received", { method: req.method, path: req.path });
    next();
  });

  app.get("/health", (_req, res) => {
    const correlationId = getCorrelationId(res);
    res.json(ok(correlationId, createHealth("api-gateway", environment)));
  });

  app.get("/metrics", (_req, res) => {
    res.json(ok(getCorrelationId(res), metrics.snapshot()));
  });

  app.post("/api/auth/mock-admin", (_req, res) => {
    const admin = platform.product.auth.createUser({ email: "admin@nexora.local", role: "admin" });
    const session = platform.product.auth.createSession(admin.id);
    res.status(201).json(ok(getCorrelationId(res), { token: session.token }));
  });

  app.post("/api/merchants", requireAuthToken, async (req, res, next) => {
    try {
      const body = merchantBodySchema.parse(req.body);
      const response = await platform.product.apiGateway.handle({
        method: "POST",
        path: "/merchants",
        token: getAuthToken(req),
        correlationId: getCorrelationId(res),
        body,
      });
      res.status(response.status).json(ok(getCorrelationId(res), response.body));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/merchants/activate", requireAuthToken, proxyToGateway(platform, "PATCH", "/merchants/activate"));
  app.patch("/api/merchants/suspend", requireAuthToken, proxyToGateway(platform, "PATCH", "/merchants/suspend"));
  app.get("/api/merchants", requireAuthToken, proxyToGateway(platform, "GET", "/merchants"));

  app.post("/api/transactions", requireAuthToken, async (req, res, next) => {
    try {
      const body = transactionBodySchema.parse(req.body);
      const response = await platform.product.apiGateway.handle({
        method: "POST",
        path: "/transactions",
        token: getAuthToken(req),
        correlationId: getCorrelationId(res),
        body,
      });
      res.status(response.status).json(ok(getCorrelationId(res), response.body));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/transactions/confirm", requireAuthToken, proxyToGateway(platform, "POST", "/transactions/confirm"));
  app.get("/api/transactions", requireAuthToken, proxyToGateway(platform, "GET", "/transactions"));
  app.post("/api/settlements", requireAuthToken, proxyToGateway(platform, "POST", "/settlements"));
  app.get("/api/settlements", requireAuthToken, proxyToGateway(platform, "GET", "/settlements"));
  app.get("/api/dashboard", requireAuthToken, proxyToGateway(platform, "GET", "/dashboard"));
  app.post("/api/pos/transactions", requireAuthToken, proxyToGateway(platform, "POST", "/pos/transactions"));
  app.post("/api/pos/confirm", requireAuthToken, proxyToGateway(platform, "POST", "/pos/confirm"));
  app.get("/api/pos/receipt", requireAuthToken, proxyToGateway(platform, "GET", "/pos/receipt"));

  app.use(((error: unknown, _req: Request, res: Response, _next) => {
    const correlationId = getCorrelationId(res);
    metrics.increment("api.errors");
    logger.error(correlationId, "request.failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    res.status(400).json(fail(correlationId, "REQUEST_REJECTED", error instanceof Error ? error.message : "Request failed."));
  }) satisfies ErrorRequestHandler);

  return app;
}

function proxyToGateway(
  platform: ReturnType<typeof createProductizedPlatform>,
  method: "GET" | "POST" | "PATCH",
  path: string,
) {
  return async (req: Request, res: Response, next: (error: unknown) => void) => {
    try {
      const response = await platform.product.apiGateway.handle({
        method,
        path,
        token: getAuthToken(req),
        correlationId: getCorrelationId(res),
        body: req.body as Record<string, unknown>,
        query: req.query as Record<string, string>,
      });
      res.status(response.status).json(ok(getCorrelationId(res), response.body));
    } catch (error) {
      next(error);
    }
  };
}

function requireAuthToken(req: Request, _res: Response, next: (error?: unknown) => void): void {
  try {
    getAuthToken(req);
    next();
  } catch (error) {
    next(error);
  }
}

function getAuthToken(req: Request): string {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) throw new Error("Bearer token required.");
  return auth.slice("Bearer ".length);
}

function getCorrelationId(res: Response): string {
  return String(res.locals["correlationId"] ?? createCorrelationId());
}
