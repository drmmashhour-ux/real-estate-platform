-- Cross-domain shared context index (Wave 12); deterministic feature rows, no vector store.
CREATE TABLE "playbook_shared_context_indexes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "domain" "MemoryDomain" NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "playbook_id" TEXT,
    "playbook_version_id" TEXT,
    "shared_signature" TEXT NOT NULL,
    "shared_features" JSONB NOT NULL,
    "segment_key" TEXT,
    "market_key" TEXT,
    "score_band" "PlaybookScoreBand",
    "last_used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "playbook_shared_context_indexes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "psci_domain_source_created" ON "playbook_shared_context_indexes"("domain", "source_type", "created_at");
CREATE INDEX "psci_shared_signature" ON "playbook_shared_context_indexes"("shared_signature");
CREATE INDEX "psci_playbook_version" ON "playbook_shared_context_indexes"("playbook_id", "playbook_version_id");
CREATE INDEX "psci_active_updated" ON "playbook_shared_context_indexes"("is_active", "updated_at");

CREATE UNIQUE INDEX "psci_source_type_id" ON "playbook_shared_context_indexes"("source_type", "source_id");
