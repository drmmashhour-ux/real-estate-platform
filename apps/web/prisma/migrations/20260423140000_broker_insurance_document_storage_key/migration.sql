-- Optional PDF certificate for broker professional liability (private storage key, not a public URL).
ALTER TABLE "broker_insurances" ADD COLUMN IF NOT EXISTS "document_storage_key" VARCHAR(512);
