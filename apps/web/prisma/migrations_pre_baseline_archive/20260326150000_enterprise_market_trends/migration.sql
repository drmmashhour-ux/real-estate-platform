-- LECIPM Enterprise workspaces (RBAC, invites, audit) + conservative market trend snapshots.

DO $$ BEGIN
  CREATE TYPE "lecipm_workspace_role" AS ENUM (
    'owner', 'admin', 'manager', 'broker', 'analyst', 'viewer', 'compliance_reviewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "lecipm_workspace_invite_status" AS ENUM (
    'pending', 'accepted', 'expired', 'revoked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "enterprise_workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "settings" JSONB,
    "seat_limit" INTEGER NOT NULL DEFAULT 10,
    "plan_tier" TEXT NOT NULL DEFAULT 'team',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enterprise_workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_workspaces_slug_key" ON "enterprise_workspaces"("slug");

CREATE TABLE IF NOT EXISTS "enterprise_workspace_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "lecipm_workspace_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enterprise_workspace_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_enterprise_workspace_member" ON "enterprise_workspace_members"("workspace_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_enterprise_workspace_member_user" ON "enterprise_workspace_members"("user_id");

CREATE TABLE IF NOT EXISTS "enterprise_workspace_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "lecipm_workspace_role" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "lecipm_workspace_invite_status" NOT NULL DEFAULT 'pending',
    "invited_by_user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enterprise_workspace_invites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_enterprise_workspace_invites_ws" ON "enterprise_workspace_invites"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_enterprise_workspace_invites_email" ON "enterprise_workspace_invites"("email");

CREATE TABLE IF NOT EXISTS "workspace_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_workspace_audit_ws_created" ON "workspace_audit_logs"("workspace_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_workspace_audit_actor" ON "workspace_audit_logs"("actor_user_id");

CREATE TABLE IF NOT EXISTS "market_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "region_slug" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'investor',
    "analysis_window_days" INTEGER NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "median_price_cents" BIGINT,
    "median_price_per_sqft" DECIMAL(18,2),
    "active_listing_count" INTEGER NOT NULL DEFAULT 0,
    "new_listing_count" INTEGER NOT NULL DEFAULT 0,
    "confidence_level" TEXT NOT NULL,
    "direction_label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "market_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_market_snapshots_region_window_date" ON "market_snapshots"("region_slug", "property_type", "mode", "analysis_window_days", "snapshot_date");
CREATE INDEX IF NOT EXISTS "idx_market_snapshots_region_date" ON "market_snapshots"("region_slug", "snapshot_date");

ALTER TABLE "enterprise_workspaces" ADD CONSTRAINT "enterprise_workspaces_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enterprise_workspace_members" ADD CONSTRAINT "enterprise_workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enterprise_workspace_members" ADD CONSTRAINT "enterprise_workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enterprise_workspace_invites" ADD CONSTRAINT "enterprise_workspace_invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enterprise_workspace_invites" ADD CONSTRAINT "enterprise_workspace_invites_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
