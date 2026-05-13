import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import type { PosService } from "../../domain/pos/posService.js";
import type { PaymentProviderId, SettlementDelay } from "../../domain/shared/types.js";
import type { BrandConfiguration } from "../brand/brandConfig.js";
import type { MerchantDashboardService } from "../dashboard/dashboardService.js";
import { renderMerchantDashboardHtml } from "../dashboard/dashboardUi.js";
import type { OnboardingService } from "../onboarding/onboardingService.js";
import { renderPosHtml } from "../pos-ui/posUi.js";

interface ApiGatewayDependencies {
  brand: BrandConfiguration;
  pos: PosService;
  dashboard: MerchantDashboardService;
  onboarding: OnboardingService;
}

type JsonObject = Record<string, unknown>;

export function createApiGateway(dependencies: ApiGatewayDependencies) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      if (req.method === "GET" && url.pathname === "/api/brand") {
        return sendJson(res, 200, dependencies.brand);
      }
      if (req.method === "GET" && url.pathname === "/api/dashboard") {
        const merchantId = requireQuery(url, "merchantId");
        return sendJson(res, 200, dependencies.dashboard.getDashboard(merchantId));
      }
      if (req.method === "GET" && url.pathname === "/ui/dashboard") {
        const merchantId = requireQuery(url, "merchantId");
        return sendHtml(
          res,
          200,
          renderMerchantDashboardHtml(
            dependencies.dashboard.getDashboard(merchantId),
            dependencies.brand,
          ),
        );
      }
      if (req.method === "GET" && url.pathname === "/ui/pos") {
        const merchantId = requireQuery(url, "merchantId");
        return sendHtml(
          res,
          200,
          renderPosHtml(
            {
              merchantId,
              availableProviders: ["mock_visa", "mock_mastercard", "mock_bank_transfer"],
            },
            dependencies.brand,
          ),
        );
      }
      if (req.method === "POST" && url.pathname === "/api/onboarding/merchants") {
        const body = await readJson(req);
        return sendJson(res, 201, dependencies.onboarding.registerMerchant(parseRegisterMerchant(body)));
      }
      if (req.method === "POST" && url.pathname === "/api/onboarding/kyc/submit") {
        const body = await readJson(req);
        return sendJson(
          res,
          200,
          dependencies.onboarding.submitMockKyc(
            requireString(body, "merchantId"),
            requireString(body, "correlationId"),
          ),
        );
      }
      if (req.method === "POST" && url.pathname === "/api/onboarding/merchants/approve") {
        const body = await readJson(req);
        return sendJson(
          res,
          200,
          dependencies.onboarding.approveMerchant(
            requireString(body, "merchantId"),
            requireString(body, "correlationId"),
          ),
        );
      }
      if (req.method === "POST" && url.pathname === "/api/onboarding/merchants/reject") {
        const body = await readJson(req);
        return sendJson(
          res,
          200,
          dependencies.onboarding.rejectMerchant(
            requireString(body, "merchantId"),
            requireString(body, "correlationId"),
          ),
        );
      }
      if (req.method === "POST" && url.pathname === "/api/pos/transactions") {
        const body = await readJson(req);
        return sendJson(res, 201, await dependencies.pos.createTransaction(parseCreateTransaction(body)));
      }
      if (req.method === "POST" && url.pathname === "/api/pos/payments/confirm") {
        const body = await readJson(req);
        return sendJson(
          res,
          200,
          await dependencies.pos.confirmPayment({
            transactionId: requireString(body, "transactionId"),
            correlationId: requireString(body, "correlationId"),
          }),
        );
      }
      if (req.method === "POST" && url.pathname === "/api/pos/receipts") {
        const body = await readJson(req);
        return sendJson(res, 201, await dependencies.pos.issueReceipt(requireString(body, "transactionId")));
      }
      if (req.method === "GET" && url.pathname === "/api/integrations/health") {
        return sendJson(res, 200, {
          mode: "mock",
          providers: ["mock_visa", "mock_mastercard", "mock_bank_transfer"],
          liveExecution: false,
        });
      }
      return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Not found" } });
    } catch (error) {
      return sendJson(res, 400, {
        error: {
          code: "API_GATEWAY_REJECTED",
          message: error instanceof Error ? error.message : "Invalid request.",
        },
      });
    }
  });
}

async function readJson(req: IncomingMessage): Promise<JsonObject> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed as JsonObject;
}

function parseRegisterMerchant(body: JsonObject) {
  return {
    displayName: requireString(body, "displayName"),
    currency: requireString(body, "currency").toUpperCase(),
    ...(body["platformFeeBps"] === undefined
      ? {}
      : { platformFeeBps: requireNonNegativeInteger(body, "platformFeeBps") }),
    ...(body["settlementDelay"] === undefined
      ? {}
      : { settlementDelay: requireSettlementDelay(body, "settlementDelay") }),
    correlationId: requireString(body, "correlationId"),
  };
}

function parseCreateTransaction(body: JsonObject) {
  return {
    merchantId: requireString(body, "merchantId"),
    provider: requireProvider(body),
    amountMinor: requirePositiveInteger(body, "amountMinor"),
    currency: requireString(body, "currency").toUpperCase(),
    idempotencyKey: requireString(body, "idempotencyKey"),
    correlationId: requireString(body, "correlationId"),
    offline: body["offline"] === true,
  };
}

function requireProvider(body: JsonObject): PaymentProviderId {
  const provider = requireString(body, "provider");
  if (provider !== "mock_visa" && provider !== "mock_mastercard" && provider !== "mock_bank_transfer") {
    throw new Error("Provider must be a mock provider.");
  }
  return provider;
}

function requireSettlementDelay(body: JsonObject, key: string): SettlementDelay {
  const value = requireString(body, key);
  if (value !== "T+1" && value !== "T+2") throw new Error(`${key} must be T+1 or T+2.`);
  return value;
}

function requireQuery(url: URL, key: string): string {
  const value = url.searchParams.get(key)?.trim();
  if (!value) throw new Error(`${key} query parameter is required.`);
  return value;
}

function requireString(body: JsonObject, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}

function requirePositiveInteger(body: JsonObject, key: string): number {
  const value = body[key];
  if (!Number.isInteger(value) || Number(value) <= 0) throw new Error(`${key} must be a positive integer.`);
  return Number(value);
}

function requireNonNegativeInteger(body: JsonObject, key: string): number {
  const value = body[key];
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`${key} must be a non-negative integer.`);
  return Number(value);
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function sendHtml(res: ServerResponse, statusCode: number, body: string) {
  res.writeHead(statusCode, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
}
