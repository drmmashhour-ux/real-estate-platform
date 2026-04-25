-- Québec closing: canonical 8-stage workflow + notary signing channel

ALTER TABLE "deal_notary_coordinations" ADD COLUMN "signing_channel" VARCHAR(24);

UPDATE "lecipm_deal_closings" SET "qc_closing_stage" = 'OFFER_ACCEPTED' WHERE "qc_closing_stage" = 'OFFER_SENT';
UPDATE "lecipm_deal_closings" SET "qc_closing_stage" = 'CONDITIONS_MET' WHERE "qc_closing_stage" = 'CONDITIONS_SATISFIED';
UPDATE "lecipm_deal_closings" SET "qc_closing_stage" = 'DOCUMENT_PREP' WHERE "qc_closing_stage" = 'NOTARY_DOCUMENT_REVIEW';
UPDATE "lecipm_deal_closings" SET "qc_closing_stage" = 'SIGNING_READY' WHERE "qc_closing_stage" = 'SIGNING_SCHEDULED';
UPDATE "lecipm_deal_closings" SET "qc_closing_stage" = 'SIGNED' WHERE "qc_closing_stage" IN ('DEED_SIGNED', 'LAND_REGISTER_PENDING');
UPDATE "lecipm_deal_closings" SET "qc_closing_stage" = 'CLOSED' WHERE "qc_closing_stage" = 'KEYS_RELEASED';
