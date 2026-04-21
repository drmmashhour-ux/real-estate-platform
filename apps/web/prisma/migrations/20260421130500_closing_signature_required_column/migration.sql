-- Required vs optional closing signers (optional rows do not block readiness).
ALTER TABLE "lecipm_deal_closing_signatures" ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT true;
