import { randomUUID } from "node:crypto";

export type AccountType = "merchant_account" | "platform_fee_account" | "settlement_account";
export type LedgerDirection = "debit" | "credit";
export type TransactionStatus = "initiated" | "authorized" | "recorded" | "settled" | "completed";
export type MerchantStatus = "pending" | "active" | "suspended" | "rejected";
export type PaymentProviderId = "mock_visa" | "mock_mastercard" | "mock_bank_transfer";
export type SettlementDelay = "T+1" | "T+2";

export interface Money {
  amountMinor: number;
  currency: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  occurredAt: Date;
  correlationId: string;
  metadata: Readonly<Record<string, string | number | boolean>>;
}

export function assertPositiveMoney(money: Money): void {
  if (!Number.isInteger(money.amountMinor) || money.amountMinor <= 0) {
    throw new Error("Money amount must be a positive integer in minor units.");
  }
  if (!/^[A-Z]{3}$/.test(money.currency)) {
    throw new Error("Money currency must be a three-letter ISO code.");
  }
}

export function createAuditEvent(input: Omit<AuditEvent, "id" | "occurredAt">): AuditEvent {
  return Object.freeze({
    id: randomUUID(),
    action: input.action,
    actor: input.actor,
    occurredAt: new Date(),
    correlationId: input.correlationId,
    metadata: Object.freeze({ ...input.metadata }),
  });
}
