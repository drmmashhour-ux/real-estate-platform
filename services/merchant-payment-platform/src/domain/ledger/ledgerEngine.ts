import { randomUUID } from "node:crypto";
import { assertPositiveMoney } from "../shared/types.js";
import type {
  LedgerAccount,
  LedgerEntry,
  LedgerTransaction,
  RecordLedgerTransactionInput,
} from "./types.js";

export class LedgerEngine {
  private readonly accounts = new Map<string, LedgerAccount>();
  private readonly transactionsByIdempotencyKey = new Map<string, LedgerTransaction>();
  private readonly entries: LedgerEntry[] = [];

  addAccount(account: LedgerAccount): LedgerAccount {
    this.accounts.set(account.id, account);
    return account;
  }

  recordTransaction(input: RecordLedgerTransactionInput): LedgerTransaction {
    const existing = this.transactionsByIdempotencyKey.get(input.idempotencyKey);
    if (existing) return existing;

    this.assertBalancedPostings(input);
    const ledgerTransactionId = randomUUID();
    const createdAt = new Date();
    const entries = input.postings.map<LedgerEntry>((posting) => {
      const account = this.accounts.get(posting.accountId);
      if (!account) throw new Error(`Unknown ledger account: ${posting.accountId}.`);
      if (account.type !== posting.accountType) {
        throw new Error(`Ledger account type mismatch for ${posting.accountId}.`);
      }
      if (account.currency !== posting.money.currency) {
        throw new Error(`Ledger account currency mismatch for ${posting.accountId}.`);
      }
      return Object.freeze({
        id: randomUUID(),
        ledgerTransactionId,
        accountId: posting.accountId,
        accountType: posting.accountType,
        direction: posting.direction,
        money: Object.freeze({ ...posting.money }),
        createdAt,
      });
    });

    const transaction = Object.freeze({
      id: ledgerTransactionId,
      idempotencyKey: input.idempotencyKey,
      transactionId: input.transactionId,
      entries: Object.freeze(entries),
      auditTrail: Object.freeze([input.auditEvent]),
      createdAt,
    });

    this.entries.push(...entries);
    this.transactionsByIdempotencyKey.set(input.idempotencyKey, transaction);
    return transaction;
  }

  getEntries(): readonly LedgerEntry[] {
    return Object.freeze([...this.entries]);
  }

  getAccountBalance(accountId: string): number {
    return this.entries
      .filter((entry) => entry.accountId === accountId)
      .reduce((sum, entry) => {
        const signedAmount =
          entry.direction === "credit" ? entry.money.amountMinor : -entry.money.amountMinor;
        return sum + signedAmount;
      }, 0);
  }

  private assertBalancedPostings(input: RecordLedgerTransactionInput): void {
    if (input.postings.length < 2) {
      throw new Error("Ledger transaction requires at least two postings.");
    }
    const currencies = new Set<string>();
    let debitTotal = 0;
    let creditTotal = 0;
    for (const posting of input.postings) {
      assertPositiveMoney(posting.money);
      currencies.add(posting.money.currency);
      if (posting.direction === "debit") debitTotal += posting.money.amountMinor;
      if (posting.direction === "credit") creditTotal += posting.money.amountMinor;
    }
    if (currencies.size !== 1) throw new Error("Ledger transaction must use one currency.");
    if (debitTotal !== creditTotal) throw new Error("Ledger transaction is not balanced.");
  }
}
