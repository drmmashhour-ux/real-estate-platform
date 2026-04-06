-- Quebec-compliant client AI chat session storage (transcript + answers)
CREATE TABLE "ai_client_chat_sessions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listing_id" TEXT,
    "project_id" TEXT,
    "lead_id" TEXT,
    "tier" TEXT,
    "score" INTEGER,
    "transcript" JSONB NOT NULL,
    "answers" JSONB,
    "compliance_tag" TEXT DEFAULT 'quebec_real_estate_v1',
    CONSTRAINT "ai_client_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_client_chat_sessions_listing_id_idx" ON "ai_client_chat_sessions"("listing_id");
CREATE INDEX "ai_client_chat_sessions_lead_id_idx" ON "ai_client_chat_sessions"("lead_id");
CREATE INDEX "ai_client_chat_sessions_created_at_idx" ON "ai_client_chat_sessions"("created_at");
