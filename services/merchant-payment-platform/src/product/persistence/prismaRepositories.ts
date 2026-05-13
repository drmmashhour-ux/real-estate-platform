import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import type {
  MerchantRecord,
  MerchantRepository,
  ProductPersistencePort,
  SettlementBatchRecord,
  SettlementRepository,
  TransactionMetadataRecord,
  TransactionRepository,
  UserRecord,
  UserRepository,
} from "./persistencePorts.js";

export class PrismaMerchantRepository implements MerchantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: MerchantRecord): Promise<void> {
    await this.prisma.productMerchant.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        displayName: record.displayName,
        status: record.status as "pending" | "active" | "suspended",
        platformFeeBps: record.platformFeeBps,
        settlementDelay: record.settlementDelay,
        createdAt: record.createdAt,
      },
      update: {
        displayName: record.displayName,
        status: record.status as "pending" | "active" | "suspended",
        platformFeeBps: record.platformFeeBps,
        settlementDelay: record.settlementDelay,
      },
    });
  }
}

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveMetadata(record: TransactionMetadataRecord): Promise<void> {
    await this.prisma.productTransactionMetadata.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        merchantId: record.merchantId,
        provider: record.provider,
        amountMinor: record.amountMinor,
        currency: record.currency,
        status: record.status,
        ledgerTransactionIds: record.ledgerTransactionIds as Prisma.InputJsonValue,
        createdAt: record.createdAt,
      },
      update: {
        provider: record.provider,
        amountMinor: record.amountMinor,
        currency: record.currency,
        status: record.status,
        ledgerTransactionIds: record.ledgerTransactionIds as Prisma.InputJsonValue,
      },
    });
  }
}

export class PrismaSettlementRepository implements SettlementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveBatch(record: SettlementBatchRecord): Promise<void> {
    await this.prisma.productSettlementBatch.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        merchantId: record.merchantId,
        status: record.status,
        delay: record.delay,
        transactionIds: record.transactionIds as Prisma.InputJsonValue,
        ledgerTransactionIds: record.ledgerTransactionIds as Prisma.InputJsonValue,
        scheduledSettlementAt: record.scheduledSettlementDate,
        createdAt: record.createdAt,
      },
      update: {
        status: record.status,
        delay: record.delay,
        transactionIds: record.transactionIds as Prisma.InputJsonValue,
        ledgerTransactionIds: record.ledgerTransactionIds as Prisma.InputJsonValue,
        scheduledSettlementAt: record.scheduledSettlementDate,
      },
    });
  }
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: UserRecord): Promise<void> {
    await this.prisma.productUser.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        email: record.email,
        role: record.role as "admin" | "merchant",
        merchantId: record.merchantId ?? null,
        createdAt: record.createdAt,
      },
      update: {
        email: record.email,
        role: record.role as "admin" | "merchant",
        merchantId: record.merchantId ?? null,
      },
    });
  }
}

export class PrismaProductPersistence implements ProductPersistencePort {
  private readonly merchantRepository: MerchantRepository;
  private readonly transactionRepository: TransactionRepository;
  private readonly settlementRepository: SettlementRepository;
  private readonly userRepository: UserRepository;

  constructor(private readonly prisma = createPrismaClient()) {
    this.merchantRepository = new PrismaMerchantRepository(prisma);
    this.transactionRepository = new PrismaTransactionRepository(prisma);
    this.settlementRepository = new PrismaSettlementRepository(prisma);
    this.userRepository = new PrismaUserRepository(prisma);
  }

  saveMerchant(record: MerchantRecord): void {
    void this.merchantRepository.save(record);
  }

  saveTransactionMetadata(record: TransactionMetadataRecord): void {
    void this.transactionRepository.saveMetadata(record);
  }

  saveSettlementBatch(record: SettlementBatchRecord): void {
    void this.settlementRepository.saveBatch(record);
  }

  saveUser(record: UserRecord): void {
    void this.userRepository.save(record);
  }
}

export function createPrismaClient(databaseUrl = process.env["DATABASE_URL"]): PrismaClient {
  if (!databaseUrl?.trim()) {
    throw new Error("DATABASE_URL is required for Prisma product persistence.");
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
