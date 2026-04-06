-- CreateTable
CREATE TABLE "product_feedback" (
    "id" TEXT NOT NULL,
    "liked" TEXT,
    "confusing" TEXT,
    "suggestions" TEXT,
    "path" VARCHAR(512),
    "userAgent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_feedback_created_at_idx" ON "product_feedback"("created_at");
