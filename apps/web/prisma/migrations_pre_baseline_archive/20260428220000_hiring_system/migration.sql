-- LECIPM hiring: candidates, interactions, evaluations, trial tasks

CREATE TABLE "hiring_candidates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "performance_flag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_candidates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hiring_candidates_stage_idx" ON "hiring_candidates"("stage");
CREATE INDEX "hiring_candidates_role_idx" ON "hiring_candidates"("role");
CREATE INDEX "hiring_candidates_email_idx" ON "hiring_candidates"("email");
CREATE INDEX "hiring_candidates_flag_idx" ON "hiring_candidates"("flag");

CREATE TABLE "hiring_candidate_interactions" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_candidate_interactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hiring_candidate_interactions_candidate_id_created_at_idx" ON "hiring_candidate_interactions"("candidate_id", "created_at");

CREATE TABLE "hiring_candidate_evaluations" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "communication_score" INTEGER NOT NULL,
    "sales_skill_score" INTEGER NOT NULL,
    "execution_score" INTEGER NOT NULL,
    "speed_score" INTEGER NOT NULL DEFAULT 0,
    "clarity_score" INTEGER NOT NULL DEFAULT 0,
    "closing_score" INTEGER NOT NULL DEFAULT 0,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_candidate_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hiring_candidate_evaluations_candidate_id_created_at_idx" ON "hiring_candidate_evaluations"("candidate_id", "created_at");

CREATE TABLE "hiring_candidate_trial_tasks" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "result_summary" TEXT,
    "response_quality" INTEGER,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_candidate_trial_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hiring_candidate_trial_tasks_candidate_id_status_idx" ON "hiring_candidate_trial_tasks"("candidate_id", "status");

ALTER TABLE "hiring_candidate_interactions" ADD CONSTRAINT "hiring_candidate_interactions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "hiring_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hiring_candidate_evaluations" ADD CONSTRAINT "hiring_candidate_evaluations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "hiring_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hiring_candidate_trial_tasks" ADD CONSTRAINT "hiring_candidate_trial_tasks_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "hiring_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
