-- Speed admin / API lookups by BNHub or CRM listing id on enforceable contracts
CREATE INDEX IF NOT EXISTS "contracts_listing_id_idx" ON "contracts" ("listing_id");
