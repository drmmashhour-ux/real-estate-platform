-- LECIPM PLATFORM — Platform Core V2 orchestration (additive)

CREATE TABLE "platform_core_decision_priorities" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "urgency" DOUBLE PRECISION NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_core_decision_priorities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_core_decision_priorities_decisionId_createdAt_idx" ON "platform_core_decision_priorities"("decisionId", "createdAt");

CREATE TABLE "platform_core_decision_dependencies" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "dependsOnDecisionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_core_decision_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_core_decision_dependencies_decisionId_idx" ON "platform_core_decision_dependencies"("decisionId");
CREATE INDEX "platform_core_decision_dependencies_dependsOnDecisionId_idx" ON "platform_core_decision_dependencies"("dependsOnDecisionId");

CREATE TABLE "platform_core_decision_schedules" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_core_decision_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_core_decision_schedules_nextRunAt_idx" ON "platform_core_decision_schedules"("nextRunAt");
CREATE INDEX "platform_core_decision_schedules_decisionId_idx" ON "platform_core_decision_schedules"("decisionId");
