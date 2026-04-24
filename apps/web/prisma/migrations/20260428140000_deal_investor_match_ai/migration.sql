-- Deal investor match AI audit + learning (broker-in-the-loop; no public solicitation)

CREATE TABLE "deal_investor_match_audit_logs" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "investor_id" TEXT,
    "actor_user_id" TEXT,
    "action" VARCHAR(48) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_investor_match_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_investor_match_audit_logs_deal_id_created_at_idx" ON "deal_investor_match_audit_logs"("deal_id", "created_at");
CREATE INDEX "deal_investor_match_audit_logs_action_idx" ON "deal_investor_match_audit_logs"("action");

ALTER TABLE "deal_investor_match_audit_logs" ADD CONSTRAINT "deal_investor_match_audit_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_investor_match_audit_logs" ADD CONSTRAINT "deal_investor_match_audit_logs_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_investor_match_audit_logs" ADD CONSTRAINT "deal_investor_match_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_investor_match_learning_events" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_investor_match_learning_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_investor_match_learning_events_deal_id_event_type_idx" ON "deal_investor_match_learning_events"("deal_id", "event_type");
CREATE INDEX "deal_investor_match_learning_events_investor_id_created_at_idx" ON "deal_investor_match_learning_events"("investor_id", "created_at");

ALTER TABLE "deal_investor_match_learning_events" ADD CONSTRAINT "deal_investor_match_learning_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_investor_match_learning_events" ADD CONSTRAINT "deal_investor_match_learning_events_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
