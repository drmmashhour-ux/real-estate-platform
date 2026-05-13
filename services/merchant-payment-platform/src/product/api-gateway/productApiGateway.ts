import type { ProductAuditLogger } from "../audit/auditLogger.js";
import type { MockAuthService } from "../auth/authService.js";
import type { DashboardProductService } from "../services/dashboardProductService.js";
import type { MerchantProductService } from "../services/merchantProductService.js";
import type { SettlementProductService } from "../services/settlementProductService.js";
import type { TransactionProductService } from "../services/transactionProductService.js";

/*
Clean architecture boundary:

UI / POS client
  -> ProductApiGateway (auth, RBAC, request logging, routing)
  -> Product services (merchant, transaction, settlement, dashboard)
  -> Financial core service interfaces (ledger-backed domain services)

The gateway does not import or call financial core services directly.
It only routes to product services.
*/

type GatewayProviderId = "mock_visa" | "mock_mastercard" | "mock_bank";

export interface ProductApiRequest {
  method: "GET" | "POST" | "PATCH";
  path: string;
  token: string;
  correlationId: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

export interface ProductApiResponse {
  status: number;
  body: unknown;
}

export interface ProductApiGatewayDependencies {
  auth: MockAuthService;
  audit: ProductAuditLogger;
  merchants: MerchantProductService;
  transactions: TransactionProductService;
  settlements: SettlementProductService;
  dashboard: DashboardProductService;
}

export class ProductApiGateway {
  constructor(private readonly dependencies: ProductApiGatewayDependencies) {}

  async handle(request: ProductApiRequest): Promise<ProductApiResponse> {
    const context = this.dependencies.auth.authenticate(request.token);
    this.dependencies.audit.record({
      category: "api_request",
      action: `${request.method} ${request.path}`,
      actorUserId: context.user.id,
      correlationId: request.correlationId,
      metadata: { path: request.path },
    });

    if (request.method === "POST" && request.path === "/merchants") {
      this.dependencies.auth.requireRole(context, ["admin"]);
      const merchantInput: {
        displayName: string;
        currency: string;
        actorUserId: string;
        correlationId: string;
        platformFeeBps?: number;
        settlementDelay?: "T+1" | "T+2";
      } = {
        displayName: readString(request.body, "displayName"),
        currency: readString(request.body, "currency"),
        actorUserId: context.user.id,
        correlationId: request.correlationId,
      };
      const platformFeeBps = readOptionalNumber(request.body, "platformFeeBps");
      const settlementDelay = readOptionalSettlementDelay(request.body, "settlementDelay");
      if (platformFeeBps !== undefined) merchantInput.platformFeeBps = platformFeeBps;
      if (settlementDelay !== undefined) merchantInput.settlementDelay = settlementDelay;
      return this.created(
        this.dependencies.merchants.registerMerchant(merchantInput),
      );
    }

    if (request.method === "PATCH" && request.path === "/merchants/activate") {
      this.dependencies.auth.requireRole(context, ["admin"]);
      return this.ok(
        this.dependencies.merchants.activateMerchant(
          readString(request.body, "merchantId"),
          context.user.id,
          request.correlationId,
        ),
      );
    }

    if (request.method === "PATCH" && request.path === "/merchants/suspend") {
      this.dependencies.auth.requireRole(context, ["admin"]);
      return this.ok(
        this.dependencies.merchants.suspendMerchant(
          readString(request.body, "merchantId"),
          context.user.id,
          request.correlationId,
        ),
      );
    }

    if (request.method === "GET" && request.path === "/merchants") {
      const merchantId = readQuery(request.query, "merchantId");
      this.dependencies.auth.requireMerchantAccess(context, merchantId);
      return this.ok(this.dependencies.merchants.getMerchant(merchantId));
    }

    if (request.method === "POST" && request.path === "/transactions") {
      const merchantId = readString(request.body, "merchantId");
      this.dependencies.auth.requireMerchantAccess(context, merchantId);
      return this.created(
        this.dependencies.transactions.createTransaction({
          merchantId,
          provider: readProvider(request.body),
          amountMinor: readPositiveInteger(request.body, "amountMinor"),
          currency: readString(request.body, "currency"),
          idempotencyKey: readString(request.body, "idempotencyKey"),
          actorUserId: context.user.id,
          correlationId: request.correlationId,
        }),
      );
    }

    if (request.method === "POST" && request.path === "/transactions/confirm") {
      return this.ok(
        await this.dependencies.transactions.confirmTransaction({
          transactionId: readString(request.body, "transactionId"),
          actorUserId: context.user.id,
          correlationId: request.correlationId,
        }),
      );
    }

    if (request.method === "GET" && request.path === "/transactions") {
      const merchantId = readQuery(request.query, "merchantId");
      this.dependencies.auth.requireMerchantAccess(context, merchantId);
      return this.ok(
        this.dependencies.transactions
          .listTransactions()
          .filter((transaction) => transaction.merchantId === merchantId),
      );
    }

    if (request.method === "POST" && request.path === "/settlements") {
      const merchantId = readString(request.body, "merchantId");
      this.dependencies.auth.requireRole(context, ["admin"]);
      return this.created(
        this.dependencies.settlements.createSettlementBatch({
          merchantId,
          transactionIds: readStringArray(request.body, "transactionIds"),
          idempotencyKey: readString(request.body, "idempotencyKey"),
          actorUserId: context.user.id,
          correlationId: request.correlationId,
        }),
      );
    }

    if (request.method === "GET" && request.path === "/settlements") {
      const merchantId = readQuery(request.query, "merchantId");
      this.dependencies.auth.requireMerchantAccess(context, merchantId);
      return this.ok(
        this.dependencies.settlements
          .listSettlementBatches()
          .filter((settlement) => settlement.merchantId === merchantId),
      );
    }

    if (request.method === "GET" && request.path === "/dashboard") {
      const merchantId = readQuery(request.query, "merchantId");
      this.dependencies.auth.requireMerchantAccess(context, merchantId);
      return this.ok(this.dependencies.dashboard.getMerchantDashboard(merchantId));
    }

    if (request.method === "POST" && request.path === "/pos/transactions") {
      const merchantId = readString(request.body, "merchantId");
      this.dependencies.auth.requireMerchantAccess(context, merchantId);
      return this.created(
        this.dependencies.transactions.createTransaction({
          merchantId,
          provider: readProvider(request.body),
          amountMinor: readPositiveInteger(request.body, "amountMinor"),
          currency: readString(request.body, "currency"),
          idempotencyKey: readString(request.body, "idempotencyKey"),
          actorUserId: context.user.id,
          correlationId: request.correlationId,
        }),
      );
    }

    if (request.method === "POST" && request.path === "/pos/confirm") {
      return this.ok(
        await this.dependencies.transactions.confirmTransaction({
          transactionId: readString(request.body, "transactionId"),
          actorUserId: context.user.id,
          correlationId: request.correlationId,
        }),
      );
    }

    if (request.method === "GET" && request.path === "/pos/receipt") {
      return this.ok(this.dependencies.transactions.getReceipt(readQuery(request.query, "transactionId")));
    }

    return { status: 404, body: { error: "Route not found." } };
  }

  private ok(body: unknown): ProductApiResponse {
    return { status: 200, body };
  }

  private created(body: unknown): ProductApiResponse {
    return { status: 201, body };
  }
}

function readString(body: Record<string, unknown> | undefined, key: string): string {
  const value = body?.[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}

function readQuery(query: Record<string, string> | undefined, key: string): string {
  const value = query?.[key]?.trim();
  if (!value) throw new Error(`${key} query parameter is required.`);
  return value;
}

function readOptionalNumber(body: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = body?.[key];
  if (value === undefined) return undefined;
  if (!Number.isInteger(value)) throw new Error(`${key} must be an integer.`);
  return Number(value);
}

function readPositiveInteger(body: Record<string, unknown> | undefined, key: string): number {
  const value = readOptionalNumber(body, key);
  if (value === undefined || value <= 0) throw new Error(`${key} must be a positive integer.`);
  return value;
}

function readOptionalSettlementDelay(
  body: Record<string, unknown> | undefined,
  key: string,
): "T+1" | "T+2" | undefined {
  const value = body?.[key];
  if (value === undefined) return undefined;
  if (value !== "T+1" && value !== "T+2") throw new Error(`${key} must be T+1 or T+2.`);
  return value;
}

function readProvider(body: Record<string, unknown> | undefined): GatewayProviderId {
  const value = readString(body, "provider");
  if (value !== "mock_visa" && value !== "mock_mastercard" && value !== "mock_bank") {
    throw new Error("Provider must be mock-only.");
  }
  return value;
}

function readStringArray(body: Record<string, unknown> | undefined, key: string): readonly string[] {
  const value = body?.[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${key} must be a string array.`);
  }
  return Object.freeze([...value]);
}
