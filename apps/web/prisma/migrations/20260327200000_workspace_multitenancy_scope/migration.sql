-- Optional enterprise workspace scope (organization / multi-tenant). NULL = legacy unscoped rows.

ALTER TABLE "deals" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "Lead" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "document_files" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "ai_actions" ADD COLUMN "workspace_id" UUID;

CREATE INDEX "deals_workspace_id_idx" ON "deals"("workspace_id");
CREATE INDEX "Lead_workspace_id_idx" ON "Lead"("workspace_id");
CREATE INDEX "document_files_workspace_id_idx" ON "document_files"("workspace_id");
CREATE INDEX "ai_actions_workspace_id_idx" ON "ai_actions"("workspace_id");

ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
