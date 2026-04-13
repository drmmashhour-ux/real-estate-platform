-- Investor Q&A for admin fundraising / diligence

CREATE TYPE "InvestorQACategory" AS ENUM ('product', 'growth', 'financials', 'strategy');

CREATE TABLE "investor_qa" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" "InvestorQACategory" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_qa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investor_qa_category_idx" ON "investor_qa"("category");
CREATE INDEX "investor_qa_sort_order_idx" ON "investor_qa"("sort_order");

INSERT INTO "investor_qa" ("id", "question", "answer", "category", "sort_order", "created_at", "updated_at") VALUES
('invqa_seed_001', 'How does LECIPM make money?', 'LECIPM monetizes through marketplace take rates on BNHUB stays, broker and listing subscription tiers, lead unlocks, and optional conversion products (mortgage, insurance referrals). Revenue is diversified across hubs to reduce single-channel risk.', 'financials', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_002', 'What are the main revenue lines today?', 'Short-term: booking fees and host tools on BNHUB; medium-term: CRM and broker workspace subscriptions, listing promotion, and transaction-adjacent services. We report rolling 30-day revenue in the investor dashboard.', 'financials', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_003', 'What is your path to profitability?', 'We focus on growing high-intent supply (listings) and conversion (bookings, broker inquiries) while keeping infra costs predictable. Target: positive unit economics per active broker and per BNHUB booking before scaling paid acquisition.', 'financials', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_004', 'How fast is the platform growing?', 'Growth is measured via total users, active users (30d), bookings, and revenue snapshots. Use the admin investor dashboard for daily history and trends—figures update from live aggregates.', 'growth', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_005', 'What markets are you prioritizing?', 'Québec-first GTM with product surfaces localized for EN/FR; expansion follows proven broker and BNHUB density. Geography is reflected in listing and stay inventory metrics.', 'growth', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_006', 'Who are your primary competitors?', 'Fragmented incumbents (portals, PMS, generic CRM) and offline broker workflows. LECIPM differentiates with hub-specific journeys (BNHUB vs long-term real estate), integrated messaging, and AI-assisted CRM for brokers.', 'strategy', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_007', 'What is your defensibility / moat?', 'Trust and workflow depth: verified listings where shown, integrated checkout, broker CRM tied to real conversations, and operational data across stays and property transactions.', 'strategy', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_008', 'Why now?', 'Operators expect unified tooling post-pandemic; buyers expect transparent booking and messaging; brokers need CRM that matches how leads actually arrive (listings + inbox).', 'strategy', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_009', 'What does the product include for buyers and sellers?', 'Discovery, saved listings, BNHUB booking flows, broker-led listing CRM, FSBO paths where enabled, and dashboards for hosts and brokers—see product roadmap slide in the pitch deck export.', 'product', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_010', 'How do you ensure listing quality?', 'Moderation queues, host and broker verification where applicable, and clear disclosure flows. Metrics include broker response times and marketplace supply/demand signals in the investor dashboard.', 'product', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_011', 'What role does AI play?', 'Assistive features for brokers (summaries, suggested replies, autopilot suggestions) with human-in-the-loop sending—no auto-send of client messages in MVP paths.', 'product', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('invqa_seed_012', 'How do you measure conversion?', 'We track inquiry-to-reply, booking funnel completion, and deal-oriented CRM stages. The investor snapshot stores a blended conversion rate for the fundraising narrative—see metrics export for details.', 'financials', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
