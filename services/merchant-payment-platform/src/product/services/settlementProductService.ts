import type { SettlementEngine } from "../../domain/settlements/settlementEngine.js";
import type { SettlementBatch } from "../../domain/settlements/types.js";
import type { ProductAuditLogger } from "../audit/auditLogger.js";
import type { ProductPersistencePort } from "../persistence/persistencePorts.js";

export class SettlementProductService {
  constructor(
    private readonly settlementCore: SettlementEngine,
    private readonly persistence: ProductPersistencePort,
    private readonly audit: ProductAuditLogger,
  ) {}

  createSettlementBatch(input: {
    merchantId: string;
    transactionIds: readonly string[];
    idempotencyKey: string;
    actorUserId: string;
    correlationId: string;
  }): SettlementBatch {
    const batch = this.settlementCore.simulateBatch({
      merchantId: input.merchantId,
      transactionIds: input.transactionIds,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
    });
    this.persistence.saveSettlementBatch({
      id: batch.id,
      merchantId: batch.merchantId,
      status: batch.status,
      delay: batch.delay,
      transactionIds: batch.transactionIds,
      ledgerTransactionIds: batch.ledgerTransactionIds,
      scheduledSettlementDate: batch.scheduledSettlementDate,
      createdAt: batch.createdAt,
    });
    this.audit.record({
      category: "transaction_action",
      action: "settlement.created",
      actorUserId: input.actorUserId,
      merchantId: input.merchantId,
      correlationId: input.correlationId,
      metadata: { transactionCount: input.transactionIds.length },
    });
    return batch;
  }

  listSettlementBatches(): readonly SettlementBatch[] {
    return this.settlementCore.listBatches();
  }
}
