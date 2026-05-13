import type { AuditEvent, Money, PaymentProviderId, TransactionStatus } from "../shared/types.js";

export interface PaymentTransaction {
  id: string;
  merchantId: string;
  provider: PaymentProviderId;
  money: Money;
  status: TransactionStatus;
  idempotencyKey: string;
  providerReference?: string;
  ledgerTransactionIds: readonly string[];
  auditTrail: readonly AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}
