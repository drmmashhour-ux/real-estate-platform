-- Field Demo Specialist hiring + performance (admin `/admin/team`)

CREATE TABLE "field_team_candidates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "notes" TEXT,
    "interview_scores" JSONB,
    "linked_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_team_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_specialist_performance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "demos_completed" INTEGER NOT NULL DEFAULT 0,
    "brokers_activated" INTEGER NOT NULL DEFAULT 0,
    "calls_made" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_specialist_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "field_specialist_performance_user_id_key" ON "field_specialist_performance"("user_id");

CREATE INDEX "field_team_candidates_status_idx" ON "field_team_candidates"("status");
CREATE INDEX "field_team_candidates_email_idx" ON "field_team_candidates"("email");
CREATE INDEX "field_team_candidates_linked_user_id_idx" ON "field_team_candidates"("linked_user_id");

ALTER TABLE "field_team_candidates" ADD CONSTRAINT "field_team_candidates_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "field_specialist_performance" ADD CONSTRAINT "field_specialist_performance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
