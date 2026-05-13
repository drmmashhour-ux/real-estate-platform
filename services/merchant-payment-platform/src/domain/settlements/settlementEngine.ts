import { randomUUID } from "node:crypto";
import { LedgerEngine } from "../ledger/ledgerEngine.js";
import type { LedgerAccount } from "../ledger/types.js";
import type { MerchantService } from "../merchants/merchantService.js";
import { createAuditEvent } from "../shared/types.js";
import type { TransactionService } from "../transactions/transactionService.js";
import type { SettlementBatch, SettlementReconciliationReport } from "./types.js";

export class SettlementEngine {
  private readonly batches: SettlementBatch[] = [];

  constructor(
    private readonly ledger: LedgerEngine,
    private readonly merchantService: MerchantService,
    private readonly transactionService: TransactionService,
    private readonly settlementAccount: LedgerAccount,
  ) {}

  simulateBatch(input: {
    merchantId: string;
    transactionIds: readonly string[];
    idempotencyKey: string;
    correlationId: string;
    now?: Date;
  }): SettlementBatch {
    const merchant = this.merchantService.getMerchant(input.merchantId);
    const createdAt = input.now ?? new Date();
    const delayDays = merchant.settlementRules.delay === "T+1" ? 1 : 2;
    const scheduledSettlementDate = new Date(createdAt);
    scheduledSettlementDate.setUTCDate(scheduledSettlementDate.getUTCDate() + delayDays);

    const ledgerTransactionIds: string[] = [];
    for (const transactionId of input.transactionIds) {
      const transaction = this.transactionService.getTransaction(transactionId);
      if (transaction.merchantId !== input.merchantId) {
        throw new Error("Settlement transaction merchant mismatch.");
      }
      if (transaction.status !== "recorded") {
        throw new Error("Only recorded transactions can enter settlement.");
      }
      const netMerchantAmount = this.ledger
        .getEntries()
        .filter(
          (entry) =>
            transaction.ledgerTransactionIds.includes(entry.ledgerTransactionId) &&
            entry.accountId === merchant.accounts.merchantAccount.id &&
            entry.direction === "credit",
        )
        .reduce((sum, entry) => sum + entry.money.amountMinor, 0);
      if (netMerchantAmount <= 0) throw new Error("No merchant ledger amount available for settlement.");

      const ledgerTransaction = this.ledger.recordTransaction({
        idempotencyKey: `${input.idempotencyKey}:${transactionId}:settle`,
        transactionId,
        postings: [
          {
            accountId: merchant.accounts.merchantAccount.id,
            accountType: "merchant_account",
            direction: "debit",
            money: { amountMinor: netMerchantAmount, currency: transaction.money.currency },
          },
          {
            accountId: this.settlementAccount.id,
            accountType: "settlement_account",
            direction: "credit",
            money: { amountMinor: netMerchantAmount, currency: transaction.money.currency },
          },
        ],
        auditEvent: createAuditEvent({
          action: "ledger.transaction.settlement_simulated",
          actor: "settlement",
          correlationId: input.correlationId,
          metadata: { transactionId, netMerchantAmount },
        }),
      });
      ledgerTransactionIds.push(ledgerTransaction.id);
      this.transactionService.markSettled(transactionId, ledgerTransaction.id, input.correlationId);
    }

    const batch = Object.freeze({
      id: randomUUID(),
      merchantId: input.merchantId,
      delay: merchant.settlementRules.delay,
      transactionIds: Object.freeze([...input.transactionIds]),
      ledgerTransactionIds: Object.freeze(ledgerTransactionIds),
      scheduledSettlementDate,
      status: "simulated" as const,
      auditTrail: Object.freeze([
        createAuditEvent({
          action: "settlement.batch.simulated",
          actor: "settlement",
          correlationId: input.correlationId,
          metadata: { transactionCount: input.transactionIds.length },
        }),
      ]),
      createdAt,
    });
    this.batches.push(batch);
    return batch;
  }

  listBatches(): readonly SettlementBatch[] {
    return Object.freeze([...this.batches]);
  }

  reconcileBatch(batchId: string, correlationId: string): SettlementReconciliationReport {
    const batch = this.batches.find((candidate) => candidate.id === batchId);
    if (!batch) throw new Error(`Settlement batch not found: ${batchId}.`);
    return Object.freeze({
      id: randomUUID(),
      batchId,
      transactionCount: batch.transactionIds.length,
      ledgerTransactionCount: batch.ledgerTransactionIds.length,
      matched: true,
      liveMoneyMoved: false,
      auditTrail: Object.freeze([
        createAuditEvent({
          action: "settlement.batch.reconciled_mock",
          actor: "settlement",
          correlationId,
          metadata: {
            batchId,
            transactionCount: batch.transactionIds.length,
            ledgerTransactionCount: batch.ledgerTransactionIds.length,
          },
        }),
      ]),
      createdAt: new Date(),
    });
  }
}
