-- Order: LECIPM autonomous optimization loop audit (signals → actions; no execution writes here).
CREATE TABLE "lecipm_autonomous_optimization_runs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL DEFAULT 'cron',
    "actions" JSONB NOT NULL,
    "summary" JSONB,

    CONSTRAINT "lecipm_autonomous_optimization_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_autonomous_optimization_runs_createdAt_idx" ON "lecipm_autonomous_optimization_runs"("createdAt");
