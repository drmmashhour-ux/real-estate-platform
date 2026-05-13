import type { AccountType, AuditEvent, LedgerDirection, Money } from "../shared/types.js";

export interface LedgerAccount {
  id: string;
  merchantId?: string;
  type: AccountType;
  currency: string;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  ledgerTransactionId: string;
  accountId: string;
  accountType: AccountType;
  direction: LedgerDirection;
  money: Money;
  createdAt: Date;
}

export interface LedgerTransaction {
  id: string;
  idempotencyKey: string;
  transactionId: string;
  entries: readonly LedgerEntry[];
  auditTrail: readonly AuditEvent[];
  createdAt: Date;
}

export interface LedgerPosting {
  accountId: string;
  accountType: AccountType;
  direction: LedgerDirection;
  money: Money;
}

export interface RecordLedgerTransactionInput {
  idempotencyKey: string;
  transactionId: string;
  postings: readonly LedgerPosting[];
  auditEvent: AuditEvent;
}
