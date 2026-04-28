-- Advisory fraud-analysis fields on booking chat (warnings only).
ALTER TABLE "sybnb_messages" ADD COLUMN "risk_level" TEXT;
ALTER TABLE "sybnb_messages" ADD COLUMN "risk_flags" JSONB;
