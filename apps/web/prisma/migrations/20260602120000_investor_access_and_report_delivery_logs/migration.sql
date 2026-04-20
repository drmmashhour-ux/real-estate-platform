-- CreateTable
CREATE TABLE "investor_access" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_delivery_logs" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "channel" VARCHAR(32),
    "pdf_path" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investor_access_email_key" ON "investor_access"("email");

-- CreateIndex
CREATE INDEX "investor_access_scope_type_scope_id_idx" ON "investor_access"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "report_delivery_logs_scope_type_scope_id_status_created_at_idx" ON "report_delivery_logs"("scope_type", "scope_id", "status", "created_at");
