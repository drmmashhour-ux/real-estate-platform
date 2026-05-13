import type { PaymentProviderId } from "../../domain/shared/types.js";
import type { ProductApiGateway } from "../api-gateway/productApiGateway.js";

export class PosApiClient {
  constructor(
    private readonly gateway: ProductApiGateway,
    private readonly token: string,
  ) {}

  createTransaction(input: {
    merchantId: string;
    provider: PaymentProviderId;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    return this.gateway.handle({
      method: "POST",
      path: "/pos/transactions",
      token: this.token,
      correlationId: input.correlationId,
      body: input,
    });
  }

  confirmTransaction(input: { transactionId: string; correlationId: string }) {
    return this.gateway.handle({
      method: "POST",
      path: "/pos/confirm",
      token: this.token,
      correlationId: input.correlationId,
      body: { transactionId: input.transactionId },
    });
  }

  fetchReceipt(input: { transactionId: string; correlationId: string }) {
    return this.gateway.handle({
      method: "GET",
      path: "/pos/receipt",
      token: this.token,
      correlationId: input.correlationId,
      query: { transactionId: input.transactionId },
    });
  }
}
