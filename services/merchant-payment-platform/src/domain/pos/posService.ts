import { financialSafetyMiddleware } from "../../safety/financialSafetyGuard.js";
import type { PaymentProviderId } from "../shared/types.js";
import type { TransactionService } from "../transactions/transactionService.js";
import type { PaymentTransaction } from "../transactions/types.js";
import { OfflineQueue } from "./offlineQueue.js";
import { issueReceipt, type Receipt } from "./receipt.js";

export class PosService {
  readonly offlineQueue = new OfflineQueue();

  constructor(private readonly transactionService: TransactionService) {}

  async createTransaction(input: {
    merchantId: string;
    provider: PaymentProviderId;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    correlationId: string;
    offline?: boolean;
  }): Promise<PaymentTransaction | { queued: true; queueId: string }> {
    if (input.offline) {
      const queued = this.offlineQueue.enqueue("createTransaction", input);
      return { queued: true, queueId: queued.id };
    }
    return financialSafetyMiddleware(async () =>
      this.transactionService.initiate({
        merchantId: input.merchantId,
        provider: input.provider,
        money: { amountMinor: input.amountMinor, currency: input.currency.toUpperCase() },
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId,
      }),
    );
  }

  async confirmPayment(input: {
    transactionId: string;
    correlationId: string;
  }): Promise<PaymentTransaction> {
    return financialSafetyMiddleware(async () => {
      const authorized = await this.transactionService.authorize(input.transactionId, input.correlationId);
      return this.transactionService.record(authorized.id, input.correlationId);
    });
  }

  async issueReceipt(transactionId: string): Promise<Receipt> {
    return financialSafetyMiddleware(async () =>
      issueReceipt(this.transactionService.getTransaction(transactionId)),
    );
  }
}
