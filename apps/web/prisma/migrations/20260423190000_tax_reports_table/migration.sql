-- Append-only platform tax lines (GST/QST) for internal audit / reporting

CREATE TABLE "tax_reports" (
    "id" TEXT NOT NULL,
    "source_type" VARCHAR(32) NOT NULL,
    "source_id" VARCHAR(64),
    "amount_cents" INTEGER NOT NULL,
    "gst_cents" INTEGER NOT NULL,
    "qst_cents" INTEGER NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "tax_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tax_reports_source_type_logged_at_idx" ON "tax_reports"("source_type", "logged_at");
CREATE INDEX "tax_reports_logged_at_idx" ON "tax_reports"("logged_at");
