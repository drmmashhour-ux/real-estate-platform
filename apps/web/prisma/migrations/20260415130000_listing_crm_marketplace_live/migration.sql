-- Broker CRM marketplace visibility — draft vs live on buyer browse / public resolve

ALTER TABLE "Listing" ADD COLUMN "crm_marketplace_live" BOOLEAN NOT NULL DEFAULT true;
