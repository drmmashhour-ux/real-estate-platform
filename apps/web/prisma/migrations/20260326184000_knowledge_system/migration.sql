DO $$ BEGIN
  CREATE TYPE "KnowledgeDocumentType" AS ENUM ('law','drafting','internal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "knowledge_documents" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "type" "KnowledgeDocumentType" NOT NULL,
  "file_url" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "knowledge_documents_type_idx" ON "knowledge_documents"("type");

CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "page_number" INTEGER,
  "embedding" DOUBLE PRECISION[] NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "knowledge_chunks_document_id_idx" ON "knowledge_chunks"("document_id");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_page_number_idx" ON "knowledge_chunks"("page_number");
