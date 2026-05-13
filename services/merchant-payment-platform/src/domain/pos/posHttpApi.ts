import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { PosService } from "./posService.js";
import type { PaymentProviderId } from "../shared/types.js";

type JsonObject = Record<string, unknown>;

export function createPosHttpServer(posService: PosService) {
  return createServer(async (req, res) => {
    try {
      if (req.method === "POST" && req.url === "/pos/transactions") {
        const body = await readJson(req);
        return sendJson(res, 201, await posService.createTransaction(parseCreateTransaction(body)));
      }
      if (req.method === "POST" && req.url === "/pos/payments/confirm") {
        const body = await readJson(req);
        return sendJson(res, 200, await posService.confirmPayment(parseConfirmPayment(body)));
      }
      if (req.method === "POST" && req.url === "/pos/receipts") {
        const body = await readJson(req);
        return sendJson(res, 201, await posService.issueReceipt(requireString(body, "transactionId")));
      }
      return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Not found" } });
    } catch (error) {
      return sendJson(res, 400, {
        error: {
          code: "POS_REQUEST_REJECTED",
          message: error instanceof Error ? error.message : "Invalid POS request.",
        },
      });
    }
  });
}

async function readJson(req: IncomingMessage): Promise<JsonObject> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed as JsonObject;
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

function parseConfirmPayment(body: JsonObject) {
  return {
    transactionId: requireString(body, "transactionId"),
    correlationId: requireString(body, "correlationId"),
  };
}

function requireProvider(body: JsonObject): PaymentProviderId {
  const provider = requireString(body, "provider");
  if (provider !== "mock_visa" && provider !== "mock_mastercard" && provider !== "mock_bank_transfer") {
    throw new Error("Provider must be a mock provider.");
  }
  return provider;
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

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
