-- Autonomous / proactive workflow suggestions + behavior signals (LECIPM; not BNHub ai_suggestions).

CREATE TABLE "lecipm_proactive_suggestions" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rationale" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "workflowType" TEXT,
    "workflowPayload" JSONB,
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_proactive_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LecipmProactiveSuggestion_ownerType_ownerId_dismissed_accepted_idx" ON "lecipm_proactive_suggestions"("ownerType", "ownerId", "dismissed", "accepted");
CREATE INDEX "LecipmProactiveSuggestion_ownerId_createdAt_idx" ON "lecipm_proactive_suggestions"("ownerId", "createdAt");

CREATE TABLE "lecipm_user_behavior_signals" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_user_behavior_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LecipmUserBehaviorSignal_ownerType_ownerId_createdAt_idx" ON "lecipm_user_behavior_signals"("ownerType", "ownerId", "createdAt");
CREATE INDEX "LecipmUserBehaviorSignal_signalType_createdAt_idx" ON "lecipm_user_behavior_signals"("signalType", "createdAt");
