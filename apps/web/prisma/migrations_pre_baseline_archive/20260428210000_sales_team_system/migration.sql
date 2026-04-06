-- LECIPM sales team: agents, assignments, performance

CREATE TABLE "sales_agents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority_weight" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_agents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_agents_user_id_key" ON "sales_agents"("user_id");
CREATE INDEX "sales_agents_active_priority_idx" ON "sales_agents"("active", "priority_weight");

CREATE TABLE "sales_assignments" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_assignments_lead_id_key" ON "sales_assignments"("lead_id");
CREATE INDEX "sales_assignments_agent_id_status_idx" ON "sales_assignments"("agent_id", "status");
CREATE INDEX "sales_assignments_status_idx" ON "sales_assignments"("status");

CREATE TABLE "sales_performance" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "leads_assigned" INTEGER NOT NULL DEFAULT 0,
    "deals_closed" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_performance_agent_id_key" ON "sales_performance"("agent_id");

ALTER TABLE "sales_agents" ADD CONSTRAINT "sales_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_assignments" ADD CONSTRAINT "sales_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "sales_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_assignments" ADD CONSTRAINT "sales_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_assignments" ADD CONSTRAINT "sales_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_performance" ADD CONSTRAINT "sales_performance_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "sales_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
