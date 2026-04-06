-- Growth CRM: lead scoring + host referral kind (first-1000 engine)
CREATE TYPE "LeadPriorityTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "early_users_tracking" ADD COLUMN     "conversion_score" INTEGER,
ADD COLUMN     "lead_tier" "LeadPriorityTier",
ADD COLUMN     "last_outreach_at" TIMESTAMP(3);

CREATE INDEX "early_users_tracking_lead_tier_idx" ON "early_users_tracking"("lead_tier");

ALTER TABLE "referrals" ADD COLUMN     "invite_kind" VARCHAR(24);

CREATE INDEX "referrals_invite_kind_idx" ON "referrals"("invite_kind");
