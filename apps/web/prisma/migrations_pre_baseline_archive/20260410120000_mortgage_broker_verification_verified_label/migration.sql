-- Normalize legacy broker profile status label (approved → verified).
UPDATE "mortgage_brokers"
SET "verification_status" = 'verified'
WHERE "verification_status" = 'approved';
