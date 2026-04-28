-- ORDER SYBNB-101 — ownership verification workflow (admin ops).

ALTER TABLE "syria_properties" ADD COLUMN "ownership_more_docs_requested_at" TIMESTAMP(3);
ALTER TABLE "syria_properties" ADD COLUMN "ownership_verification_review_note" TEXT;
