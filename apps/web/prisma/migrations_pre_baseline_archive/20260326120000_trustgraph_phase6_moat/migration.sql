-- Phase 6 TrustGraph: extraction, geospatial, fraud graph, media classification columns

-- Media verification job — classification columns
ALTER TABLE "media_verification_jobs" ADD COLUMN IF NOT EXISTS "predicted_category" TEXT;
ALTER TABLE "media_verification_jobs" ADD COLUMN IF NOT EXISTS "scene_confidence" DOUBLE PRECISION;
ALTER TABLE "media_verification_jobs" ADD COLUMN IF NOT EXISTS "classification_engine_version" TEXT;
ALTER TABLE "media_verification_jobs" ADD COLUMN IF NOT EXISTS "perceptual_hash" TEXT;

-- Enums
CREATE TYPE "TrustgraphExtractionSourceKind" AS ENUM ('seller_supporting_document', 'mortgage_request');
CREATE TYPE "TrustgraphExtractionJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'needs_review');
CREATE TYPE "TrustgraphFraudGraphNodeKind" AS ENUM ('user', 'listing', 'broker', 'upload', 'fingerprint', 'phone', 'email');

-- Extraction jobs
CREATE TABLE "trustgraph_extraction_jobs" (
    "id" TEXT NOT NULL,
    "source_kind" "TrustgraphExtractionSourceKind" NOT NULL,
    "source_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT,
    "mortgage_file_id" TEXT,
    "status" "TrustgraphExtractionJobStatus" NOT NULL DEFAULT 'queued',
    "model_version" TEXT NOT NULL DEFAULT 'stub-v1',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_extraction_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_extraction_source" ON "trustgraph_extraction_jobs"("source_kind", "source_id");
CREATE INDEX "idx_tg_extraction_listing" ON "trustgraph_extraction_jobs"("fsbo_listing_id");

-- Extracted document records
CREATE TABLE "trustgraph_extracted_document_records" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "storage_ref" TEXT NOT NULL,
    "document_type" TEXT,
    "extraction_status" TEXT NOT NULL DEFAULT 'pending',
    "extracted_payload" JSONB,
    "normalized_payload" JSONB,
    "confidence" DOUBLE PRECISION,
    "model_version" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_extracted_document_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trustgraph_extracted_document_records_job_id_key" ON "trustgraph_extracted_document_records"("job_id");
ALTER TABLE "trustgraph_extracted_document_records" ADD CONSTRAINT "trustgraph_extracted_document_records_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "trustgraph_extraction_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_extracted_document_fields" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_value" TEXT,
    "confidence" DOUBLE PRECISION,
    "value_source" TEXT NOT NULL DEFAULT 'extraction',

    CONSTRAINT "trustgraph_extracted_document_fields_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_extracted_fields_record" ON "trustgraph_extracted_document_fields"("record_id");
ALTER TABLE "trustgraph_extracted_document_fields" ADD CONSTRAINT "trustgraph_extracted_document_fields_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "trustgraph_extracted_document_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_extraction_review_actions" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_extraction_review_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_extraction_reviews_record" ON "trustgraph_extraction_review_actions"("record_id");
ALTER TABLE "trustgraph_extraction_review_actions" ADD CONSTRAINT "trustgraph_extraction_review_actions_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "trustgraph_extracted_document_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fraud graph
CREATE TABLE "fraud_graph_nodes" (
    "id" TEXT NOT NULL,
    "kind" "TrustgraphFraudGraphNodeKind" NOT NULL,
    "external_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fraud_graph_nodes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_fraud_graph_node_kind_ext" ON "fraud_graph_nodes"("kind", "external_id");

CREATE TABLE "fraud_graph_edges" (
    "id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_graph_edges_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_fraud_edge_from" ON "fraud_graph_edges"("from_node_id");
CREATE INDEX "idx_fraud_edge_to" ON "fraud_graph_edges"("to_node_id");
ALTER TABLE "fraud_graph_edges" ADD CONSTRAINT "fraud_graph_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "fraud_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fraud_graph_edges" ADD CONSTRAINT "fraud_graph_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "fraud_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "fraud_graph_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_graph_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_fraud_graph_events_type" ON "fraud_graph_events"("event_type");

-- Geospatial validation
CREATE TABLE "trustgraph_geospatial_validations" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "provider_summary" JSONB,
    "precision_score" DOUBLE PRECISION,
    "city_match" BOOLEAN,
    "warnings" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_geospatial_validations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trustgraph_geospatial_validations_fsbo_listing_id_key" ON "trustgraph_geospatial_validations"("fsbo_listing_id");
ALTER TABLE "trustgraph_geospatial_validations" ADD CONSTRAINT "trustgraph_geospatial_validations_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
