-- Heuristic pre-approval fields (informational; broker confirms)
ALTER TABLE "mortgage_requests" ADD COLUMN "estimated_approval_amount" DOUBLE PRECISION;
ALTER TABLE "mortgage_requests" ADD COLUMN "estimated_monthly_payment" DOUBLE PRECISION;
ALTER TABLE "mortgage_requests" ADD COLUMN "approval_confidence" TEXT;
