-- Structured legal intelligence tags on knowledge chunks

DO $$ BEGIN
  CREATE TYPE "KnowledgeChunkSemanticType" AS ENUM ('declaration', 'obligation', 'clause', 'process');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "KnowledgeChunkAudience" AS ENUM ('seller', 'buyer', 'broker', 'transaction');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "KnowledgeChunkImportance" AS ENUM ('mandatory', 'optional');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "chunk_type" "KnowledgeChunkSemanticType" NOT NULL DEFAULT 'declaration';
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "audience" "KnowledgeChunkAudience" NOT NULL DEFAULT 'transaction';
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "importance" "KnowledgeChunkImportance" NOT NULL DEFAULT 'optional';

CREATE INDEX IF NOT EXISTS "knowledge_chunks_chunk_type_idx" ON "knowledge_chunks"("chunk_type");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_audience_idx" ON "knowledge_chunks"("audience");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_importance_idx" ON "knowledge_chunks"("importance");
