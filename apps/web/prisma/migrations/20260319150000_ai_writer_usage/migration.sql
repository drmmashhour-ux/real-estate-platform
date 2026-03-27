-- CreateTable
CREATE TABLE "ai_writer_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "action" TEXT,
    "prompt_len" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_writer_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_writer_usage_logs_user_id_created_at_idx" ON "ai_writer_usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_writer_usage_logs_created_at_idx" ON "ai_writer_usage_logs"("created_at");
