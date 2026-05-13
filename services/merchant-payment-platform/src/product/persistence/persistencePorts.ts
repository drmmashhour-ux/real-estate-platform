export interface MerchantRecord {
  id: string;
  displayName: string;
  status: string;
  platformFeeBps: number;
  settlementDelay: string;
  createdAt: Date;
}

export interface TransactionMetadataRecord {
  id: string;
  merchantId: string;
  provider: string;
  amountMinor: number;
  currency: string;
  status: string;
  ledgerTransactionIds: readonly string[];
  createdAt: Date;
}

export interface SettlementBatchRecord {
  id: string;
  merchantId: string;
  status: string;
  delay: string;
  transactionIds: readonly string[];
  ledgerTransactionIds: readonly string[];
  scheduledSettlementDate: Date;
  createdAt: Date;
}

export interface UserRecord {
  id: string;
  email: string;
  role: string;
  merchantId?: string;
  createdAt: Date;
}

export interface ProductPersistencePort {
  saveMerchant(record: MerchantRecord): void;
  saveTransactionMetadata(record: TransactionMetadataRecord): void;
  saveSettlementBatch(record: SettlementBatchRecord): void;
  saveUser(record: UserRecord): void;
}

export class InMemoryProductPersistence implements ProductPersistencePort {
  readonly merchants = new Map<string, MerchantRecord>();
  readonly transactions = new Map<string, TransactionMetadataRecord>();
  readonly settlements = new Map<string, SettlementBatchRecord>();
  readonly users = new Map<string, UserRecord>();

  saveMerchant(record: MerchantRecord): void {
    this.merchants.set(record.id, Object.freeze({ ...record }));
  }

  saveTransactionMetadata(record: TransactionMetadataRecord): void {
    this.transactions.set(record.id, Object.freeze({ ...record }));
  }

  saveSettlementBatch(record: SettlementBatchRecord): void {
    this.settlements.set(record.id, Object.freeze({ ...record }));
  }

  saveUser(record: UserRecord): void {
    this.users.set(record.id, Object.freeze({ ...record }));
  }
}
