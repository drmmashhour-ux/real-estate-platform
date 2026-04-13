-- CreateEnum
CREATE TYPE "FraudEntityType" AS ENUM ('user', 'listing', 'booking', 'payment', 'message');

-- CreateEnum
CREATE TYPE "FraudRiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "FraudCaseStatus" AS ENUM ('open', 'under_review', 'confirmed_fraud', 'false_positive', 'resolved');

-- CreateEnum
CREATE TYPE "FraudActionType" AS ENUM ('allow', 'monitor', 'review', 'challenge', 'block');

-- CreateTable
CREATE TABLE "fraud_signal_events" (
    "id" UUID NOT NULL,
    "entityType" "FraudEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "signalValue" TEXT,
    "riskPoints" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_signal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_policy_scores" (
    "id" UUID NOT NULL,
    "entityType" "FraudEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "FraudRiskLevel" NOT NULL DEFAULT 'low',
    "recommendedAction" "FraudActionType" NOT NULL DEFAULT 'monitor',
    "reasonsJson" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_policy_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_cases" (
    "id" UUID NOT NULL,
    "entityType" "FraudEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "riskLevel" "FraudRiskLevel" NOT NULL,
    "status" "FraudCaseStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_decisions" (
    "id" UUID NOT NULL,
    "fraudCaseId" UUID NOT NULL,
    "actionType" "FraudActionType" NOT NULL,
    "decidedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fraud_signal_events_entityType_idx" ON "fraud_signal_events"("entityType");

-- CreateIndex
CREATE INDEX "fraud_signal_events_entityId_idx" ON "fraud_signal_events"("entityId");

-- CreateIndex
CREATE INDEX "fraud_signal_events_signalType_idx" ON "fraud_signal_events"("signalType");

-- CreateIndex
CREATE INDEX "fraud_signal_events_createdAt_idx" ON "fraud_signal_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_policy_scores_entityType_entityId_key" ON "fraud_policy_scores"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "fraud_policy_scores_riskLevel_idx" ON "fraud_policy_scores"("riskLevel");

-- CreateIndex
CREATE INDEX "fraud_cases_entityType_idx" ON "fraud_cases"("entityType");

-- CreateIndex
CREATE INDEX "fraud_cases_entityId_idx" ON "fraud_cases"("entityId");

-- CreateIndex
CREATE INDEX "fraud_cases_status_idx" ON "fraud_cases"("status");

-- CreateIndex
CREATE INDEX "fraud_cases_riskLevel_idx" ON "fraud_cases"("riskLevel");

-- CreateIndex
CREATE INDEX "fraud_decisions_fraudCaseId_idx" ON "fraud_decisions"("fraudCaseId");

-- AddForeignKey
ALTER TABLE "fraud_decisions" ADD CONSTRAINT "fraud_decisions_fraudCaseId_fkey" FOREIGN KEY ("fraudCaseId") REFERENCES "fraud_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
