-- Residential brokerage office enums + columns (Québec residential scope; no commercial flows in this phase).
-- Backfills: commission cases default to residential_sale; offices default to residential_only.

-- New membership roles (legacy `broker` / `coordinator` remain valid).
ALTER TYPE "OfficeMembershipRole" ADD VALUE 'residential_broker';
ALTER TYPE "OfficeMembershipRole" ADD VALUE 'transaction_coordinator';

CREATE TYPE "BrokerageOfficeType" AS ENUM ('residential_only');

CREATE TYPE "OfficeTeamType" AS ENUM (
  'residential_sales',
  'buyer_rep',
  'seller_rep',
  'transaction_support'
);

CREATE TYPE "CommissionPlanScope" AS ENUM ('residential_only');

CREATE TYPE "ResidentialTransactionType" AS ENUM (
  'residential_sale',
  'residential_purchase_representation',
  'residential_listing_side',
  'divided_coownership',
  'undivided_coownership',
  'residential_lease'
);

ALTER TABLE "brokerage_offices" ADD COLUMN "office_type" "BrokerageOfficeType" NOT NULL DEFAULT 'residential_only';

ALTER TABLE "brokerage_office_settings" ADD COLUMN "residential_workflow_config" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "office_teams" ADD COLUMN "team_type" "OfficeTeamType" NOT NULL DEFAULT 'residential_sales';

ALTER TABLE "office_team_memberships" RENAME COLUMN "team_role" TO "role";

ALTER TABLE "brokerage_commission_plans" ADD COLUMN "scope" "CommissionPlanScope" NOT NULL DEFAULT 'residential_only';

ALTER TABLE "brokerage_commission_cases" ADD COLUMN "transaction_type" "ResidentialTransactionType" NOT NULL DEFAULT 'residential_sale';
