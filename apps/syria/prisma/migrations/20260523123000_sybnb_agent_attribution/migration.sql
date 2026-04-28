-- SYBNB-27 — Field agent attribution on stay listings (manual incentive tracking).

ALTER TABLE "syria_properties" ADD COLUMN "sybnb_agent_user_id" TEXT;

CREATE INDEX "syria_properties_sybnb_agent_user_id_idx" ON "syria_properties"("sybnb_agent_user_id");

ALTER TABLE "syria_properties" ADD CONSTRAINT "syria_properties_sybnb_agent_user_id_fkey" FOREIGN KEY ("sybnb_agent_user_id") REFERENCES "syria_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
