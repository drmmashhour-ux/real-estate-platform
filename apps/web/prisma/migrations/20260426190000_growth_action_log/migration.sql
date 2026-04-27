CREATE TABLE "GrowthActionLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GrowthActionLog_created_at_idx" ON "GrowthActionLog"("created_at");
