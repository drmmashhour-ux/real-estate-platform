import { randomUUID } from "node:crypto";
import { LedgerEngine } from "../ledger/ledgerEngine.js";
import type { LedgerAccount } from "../ledger/types.js";
import type { MerchantService } from "../merchants/merchantService.js";
import { getPaymentProvider } from "../providers/providerRegistry.js";
import { calculatePlatformFee } from "../settlements/feeCalculator.js";
import { assertPositiveMoney, createAuditEvent, type Money, type PaymentProviderId } from "../shared/types.js";
import type { PaymentTransaction } from "./types.js";

export class TransactionService {
  private readonly transactions = new Map<string, PaymentTransaction>();
  private readonly transactionsByIdempotencyKey = new Map<string, PaymentTransaction>();

  constructor(
    private readonly ledger: LedgerEngine,
    private readonly merchantService: MerchantService,
    private readonly platformFeeAccount: LedgerAccount,
    private readonly settlementAccount: LedgerAccount,
  ) {}

  initiate(input: {
    merchantId: string;
    provider: PaymentProviderId;
    money: Money;
    idempotencyKey: string;
    correlationId: string;
  }): PaymentTransaction {
    const existing = this.transactionsByIdempotencyKey.get(input.idempotencyKey);
    if (existing) return existing;
    assertPositiveMoney(input.money);
    const merchant = this.merchantService.getMerchant(input.merchantId);
    if (merchant.status !== "active") throw new Error("Merchant must be active before payment.");
    const transaction = Object.freeze({
      id: randomUUID(),
      merchantId: input.merchantId,
      provider: input.provider,
      money: Object.freeze({ ...input.money }),
      status: "initiated" as const,
      idempotencyKey: input.idempotencyKey,
      ledgerTransactionIds: Object.freeze([]),
      auditTrail: Object.freeze([
        createAuditEvent({
          action: "transaction.initiated",
          actor: "transaction",
          correlationId: input.correlationId,
          metadata: { merchantId: input.merchantId, provider: input.provider },
        }),
      ]),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.transactions.set(transaction.id, transaction);
    this.transactionsByIdempotencyKey.set(input.idempotencyKey, transaction);
    return transaction;
  }

  async authorize(transactionId: string, correlationId: string): Promise<PaymentTransaction> {
    const transaction = this.getTransaction(transactionId);
    if (transaction.status !== "initiated") return transaction;
    const provider = getPaymentProvider(transaction.provider);
    const result = await provider.authorize({
      provider: transaction.provider,
      transactionId: transaction.id,
      merchantId: transaction.merchantId,
      money: transaction.money,
      idempotencyKey: `${transaction.idempotencyKey}:authorize`,
    });
    return this.replaceTransaction(transaction.id, {
      ...transaction,
      status: "authorized",
      providerReference: result.providerReference,
      updatedAt: new Date(),
      auditTrail: Object.freeze([
        ...transaction.auditTrail,
        createAuditEvent({
          action: "transaction.authorized",
          actor: "provider",
          correlationId,
          metadata: { provider: transaction.provider, liveExecution: result.liveExecution },
        }),
      ]),
    });
  }

  record(transactionId: string, correlationId: string): PaymentTransaction {
    const transaction = this.getTransaction(transactionId);
    if (transaction.status === "recorded" || transaction.status === "settled" || transaction.status === "completed") {
      return transaction;
    }
    if (transaction.status !== "authorized") throw new Error("Transaction must be authorized before recording.");

    const merchant = this.merchantService.getMerchant(transaction.merchantId);
    const feeBreakdown = calculatePlatformFee({
      gross: transaction.money,
      platformFeeBps: merchant.feeConfiguration.platformFeeBps,
    });
    const postings = [
      {
        accountId: this.settlementAccount.id,
        accountType: "settlement_account" as const,
        direction: "debit" as const,
        money: transaction.money,
      },
      {
        accountId: merchant.accounts.merchantAccount.id,
        accountType: "merchant_account" as const,
        direction: "credit" as const,
        money: feeBreakdown.merchantNet,
      },
      ...(feeBreakdown.platformFee.amountMinor > 0
        ? [
            {
              accountId: this.platformFeeAccount.id,
              accountType: "platform_fee_account" as const,
              direction: "credit" as const,
              money: feeBreakdown.platformFee,
            },
          ]
        : []),
    ];

    const ledgerTransaction = this.ledger.recordTransaction({
      idempotencyKey: `${transaction.idempotencyKey}:record`,
      transactionId: transaction.id,
      postings,
      auditEvent: createAuditEvent({
        action: "ledger.transaction.recorded",
        actor: "ledger",
        correlationId,
        metadata: {
          transactionId: transaction.id,
          feeMinor: feeBreakdown.platformFee.amountMinor,
          merchantNetMinor: feeBreakdown.merchantNet.amountMinor,
        },
      }),
    });

    return this.replaceTransaction(transaction.id, {
      ...transaction,
      status: "recorded",
      ledgerTransactionIds: Object.freeze([...transaction.ledgerTransactionIds, ledgerTransaction.id]),
      updatedAt: new Date(),
      auditTrail: Object.freeze([
        ...transaction.auditTrail,
        createAuditEvent({
          action: "transaction.recorded",
          actor: "ledger",
          correlationId,
          metadata: { ledgerTransactionId: ledgerTransaction.id },
        }),
      ]),
    });
  }

  markSettled(transactionId: string, ledgerTransactionId: string, correlationId: string): PaymentTransaction {
    const transaction = this.getTransaction(transactionId);
    if (transaction.status === "completed" || transaction.status === "settled") return transaction;
    if (transaction.status !== "recorded") throw new Error("Transaction must be recorded before settlement.");
    return this.replaceTransaction(transaction.id, {
      ...transaction,
      status: "settled",
      ledgerTransactionIds: Object.freeze([...transaction.ledgerTransactionIds, ledgerTransactionId]),
      updatedAt: new Date(),
      auditTrail: Object.freeze([
        ...transaction.auditTrail,
        createAuditEvent({
          action: "transaction.settled",
          actor: "settlement",
          correlationId,
          metadata: { ledgerTransactionId },
        }),
      ]),
    });
  }

  complete(transactionId: string, correlationId: string): PaymentTransaction {
    const transaction = this.getTransaction(transactionId);
    if (transaction.status === "completed") return transaction;
    if (transaction.status !== "settled") throw new Error("Transaction must be settled before completion.");
    return this.replaceTransaction(transaction.id, {
      ...transaction,
      status: "completed",
      updatedAt: new Date(),
      auditTrail: Object.freeze([
        ...transaction.auditTrail,
        createAuditEvent({
          action: "transaction.completed",
          actor: "system",
          correlationId,
          metadata: { transactionId: transaction.id },
        }),
      ]),
    });
  }

  getTransaction(transactionId: string): PaymentTransaction {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error(`Transaction not found: ${transactionId}.`);
    return transaction;
  }

  listTransactions(): readonly PaymentTransaction[] {
    return Object.freeze([...this.transactions.values()]);
  }

  private replaceTransaction(id: string, transaction: PaymentTransaction): PaymentTransaction {
    const frozen = Object.freeze(transaction);
    this.transactions.set(id, frozen);
    this.transactionsByIdempotencyKey.set(frozen.idempotencyKey, frozen);
    return frozen;
  }
}
