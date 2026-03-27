-- Legal intelligence graph tables
DO $$ BEGIN
  CREATE TYPE "LegalGraphIssueStatus" AS ENUM ('open','resolved','dismissed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE "LegalGraphIssueSeverity" AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "legal_graph_nodes" (
  "id" TEXT PRIMARY KEY,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "node_type" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "legal_graph_nodes_entity_type_entity_id_idx" ON "legal_graph_nodes"("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "legal_graph_nodes_node_type_idx" ON "legal_graph_nodes"("node_type");

CREATE TABLE IF NOT EXISTS "legal_graph_edges" (
  "id" TEXT PRIMARY KEY,
  "from_node_id" TEXT NOT NULL,
  "to_node_id" TEXT NOT NULL,
  "edge_type" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "legal_graph_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE CASCADE,
  CONSTRAINT "legal_graph_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "legal_graph_edges_from_node_id_idx" ON "legal_graph_edges"("from_node_id");
CREATE INDEX IF NOT EXISTS "legal_graph_edges_to_node_id_idx" ON "legal_graph_edges"("to_node_id");
CREATE INDEX IF NOT EXISTS "legal_graph_edges_edge_type_idx" ON "legal_graph_edges"("edge_type");

CREATE TABLE IF NOT EXISTS "legal_graph_issues" (
  "id" TEXT PRIMARY KEY,
  "property_id" TEXT NOT NULL,
  "issue_type" TEXT NOT NULL,
  "severity" "LegalGraphIssueSeverity" NOT NULL,
  "source_node_id" TEXT NOT NULL,
  "related_node_id" TEXT,
  "status" "LegalGraphIssueStatus" NOT NULL DEFAULT 'open',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "legal_graph_issues_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE CASCADE,
  CONSTRAINT "legal_graph_issues_related_node_id_fkey" FOREIGN KEY ("related_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "legal_graph_issues_property_id_idx" ON "legal_graph_issues"("property_id");
CREATE INDEX IF NOT EXISTS "legal_graph_issues_issue_type_idx" ON "legal_graph_issues"("issue_type");
CREATE INDEX IF NOT EXISTS "legal_graph_issues_status_idx" ON "legal_graph_issues"("status");
CREATE INDEX IF NOT EXISTS "legal_graph_issues_severity_idx" ON "legal_graph_issues"("severity");
