CREATE TYPE "ProductUserRole" AS ENUM ('admin', 'merchant');
CREATE TYPE "ProductMerchantStatus" AS ENUM ('pending', 'active', 'suspended');

CREATE TABLE "product_users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "ProductUserRole" NOT NULL,
  "merchantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_users_email_key" ON "product_users"("email");

CREATE TABLE "product_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_sessions_userId_idx" ON "product_sessions"("userId");
ALTER TABLE "product_sessions"
  ADD CONSTRAINT "product_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "product_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_merchants" (
  "id" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" "ProductMerchantStatus" NOT NULL,
  "platformFeeBps" INTEGER NOT NULL,
  "settlementDelay" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_merchants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_merchants_status_idx" ON "product_merchants"("status");

CREATE TABLE "product_transaction_metadata" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ledgerTransactionIds" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_transaction_metadata_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_transaction_metadata_merchantId_idx" ON "product_transaction_metadata"("merchantId");
CREATE INDEX "product_transaction_metadata_status_idx" ON "product_transaction_metadata"("status");

CREATE TABLE "product_settlement_batches" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "delay" TEXT NOT NULL,
  "transactionIds" JSONB NOT NULL,
  "ledgerTransactionIds" JSONB NOT NULL,
  "scheduledSettlementAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_settlement_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_settlement_batches_merchantId_idx" ON "product_settlement_batches"("merchantId");
CREATE INDEX "product_settlement_batches_status_idx" ON "product_settlement_batches"("status");

CREATE TABLE "product_audit_logs" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT,
  "merchantId" TEXT,
  "transactionId" TEXT,
  "correlationId" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_audit_logs_correlationId_idx" ON "product_audit_logs"("correlationId");
CREATE INDEX "product_audit_logs_category_idx" ON "product_audit_logs"("category");
