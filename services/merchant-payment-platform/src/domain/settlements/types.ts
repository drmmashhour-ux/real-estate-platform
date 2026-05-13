import type { AuditEvent, SettlementDelay } from "../shared/types.js";

export interface SettlementBatch {
  id: string;
  merchantId: string;
  delay: SettlementDelay;
  transactionIds: readonly string[];
  ledgerTransactionIds: readonly string[];
  scheduledSettlementDate: Date;
  status: "simulated" | "reconciled";
  auditTrail: readonly AuditEvent[];
  createdAt: Date;
}

export interface SettlementReconciliationReport {
  id: string;
  batchId: string;
  transactionCount: number;
  ledgerTransactionCount: number;
  matched: true;
  liveMoneyMoved: false;
  auditTrail: readonly AuditEvent[];
  createdAt: Date;
}
