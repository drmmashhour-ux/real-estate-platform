-- LECIPM monopoly layer: workspace-scoped deal history, reputation, collaboration, referrals.

CREATE TYPE "lecipm_deal_history_outcome" AS ENUM ('won', 'lost', 'canceled');

CREATE TABLE "deal_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "deal_id" TEXT NOT NULL,
    "outcome" "lecipm_deal_history_outcome" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "timeline" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_deal_history_ws_created" ON "deal_history"("workspace_id", "created_at" DESC);
CREATE INDEX "idx_deal_history_deal" ON "deal_history"("deal_id");

ALTER TABLE "deal_history" ADD CONSTRAINT "deal_history_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_history" ADD CONSTRAINT "deal_history_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workspace_broker_reputation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deals_counted" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_broker_reputation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_workspace_broker_reputation" ON "workspace_broker_reputation"("workspace_id", "broker_user_id");
CREATE INDEX "idx_ws_broker_rep_ws" ON "workspace_broker_reputation"("workspace_id");

ALTER TABLE "workspace_broker_reputation" ADD CONSTRAINT "workspace_broker_reputation_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_broker_reputation" ADD CONSTRAINT "workspace_broker_reputation_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workspace_deal_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "deal_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_deal_shares_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ws_deal_share_ws_deal" ON "workspace_deal_shares"("workspace_id", "deal_id");
CREATE INDEX "idx_ws_deal_share_target" ON "workspace_deal_shares"("target_user_id");

ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workspace_collaboration_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "deal_id" TEXT,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_collaboration_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ws_collab_ws_created" ON "workspace_collaboration_messages"("workspace_id", "created_at" DESC);
CREATE INDEX "idx_ws_collab_deal" ON "workspace_collaboration_messages"("deal_id");

ALTER TABLE "workspace_collaboration_messages" ADD CONSTRAINT "workspace_collaboration_messages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_collaboration_messages" ADD CONSTRAINT "workspace_collaboration_messages_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "workspace_collaboration_messages" ADD CONSTRAINT "workspace_collaboration_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workspace_referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "referred_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_referrals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ws_referral_ws" ON "workspace_referrals"("workspace_id");
CREATE INDEX "idx_ws_referral_email" ON "workspace_referrals"("referred_email");

ALTER TABLE "workspace_referrals" ADD CONSTRAINT "workspace_referrals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_referrals" ADD CONSTRAINT "workspace_referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
