-- Deferred FK: lecipm_broker_crm_leads is created in 20260422160000_lecipm_broker_crm_ai (after broker_autopilot migration timestamp 20260402193000).
DO $$ BEGIN
  ALTER TABLE "lecipm_broker_autopilot_actions" ADD CONSTRAINT "lecipm_broker_autopilot_actions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
