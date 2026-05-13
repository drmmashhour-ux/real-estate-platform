import type { PaymentProviderId } from "../../domain/shared/types.js";
import type { TransactionService } from "../../domain/transactions/transactionService.js";
import type { PaymentTransaction } from "../../domain/transactions/types.js";
import type { ProductAuditLogger } from "../audit/auditLogger.js";
import type { ProductPersistencePort } from "../persistence/persistencePorts.js";

export class TransactionProductService {
  constructor(
    private readonly transactionCore: TransactionService,
    private readonly persistence: ProductPersistencePort,
    private readonly audit: ProductAuditLogger,
  ) {}

  createTransaction(input: {
    merchantId: string;
    provider: PaymentProviderId;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    actorUserId: string;
    correlationId: string;
  }): PaymentTransaction {
    const transaction = this.transactionCore.initiate({
      merchantId: input.merchantId,
      provider: input.provider,
      money: { amountMinor: input.amountMinor, currency: input.currency },
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
    });
    this.persistTransaction(transaction);
    this.audit.record({
      category: "transaction_action",
      action: "transaction.created",
      actorUserId: input.actorUserId,
      merchantId: input.merchantId,
      transactionId: transaction.id,
      correlationId: input.correlationId,
      metadata: { status: transaction.status },
    });
    return transaction;
  }

  async confirmTransaction(input: {
    transactionId: string;
    actorUserId: string;
    correlationId: string;
  }): Promise<PaymentTransaction> {
    const authorized = await this.transactionCore.authorize(input.transactionId, input.correlationId);
    const recorded = this.transactionCore.record(authorized.id, input.correlationId);
    this.persistTransaction(recorded);
    this.audit.record({
      category: "transaction_action",
      action: "transaction.confirmed",
      actorUserId: input.actorUserId,
      merchantId: recorded.merchantId,
      transactionId: recorded.id,
      correlationId: input.correlationId,
      metadata: { status: recorded.status },
    });
    return recorded;
  }

  getReceipt(transactionId: string): {
    id: string;
    transactionId: string;
    merchantId: string;
    amountMinor: number;
    currency: string;
    status: string;
    ledgerTransactionIds: readonly string[];
    liveExecution: false;
  } {
    const transaction = this.transactionCore.getTransaction(transactionId);
    return Object.freeze({
      id: `receipt_${transaction.id}`,
      transactionId: transaction.id,
      merchantId: transaction.merchantId,
      amountMinor: transaction.money.amountMinor,
      currency: transaction.money.currency,
      status: transaction.status,
      ledgerTransactionIds: Object.freeze([...transaction.ledgerTransactionIds]),
      liveExecution: false,
    });
  }

  listTransactions(): readonly PaymentTransaction[] {
    return this.transactionCore.listTransactions();
  }

  private persistTransaction(transaction: PaymentTransaction): void {
    this.persistence.saveTransactionMetadata({
      id: transaction.id,
      merchantId: transaction.merchantId,
      provider: transaction.provider,
      amountMinor: transaction.money.amountMinor,
      currency: transaction.money.currency,
      status: transaction.status,
      ledgerTransactionIds: transaction.ledgerTransactionIds,
      createdAt: transaction.createdAt,
    });
  }
}
