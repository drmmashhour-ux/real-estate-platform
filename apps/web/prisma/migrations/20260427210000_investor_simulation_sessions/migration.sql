-- Extend investor Q&A + practice meeting sessions

ALTER TYPE "InvestorQACategory" ADD VALUE IF NOT EXISTS 'competition';

CREATE TYPE "InvestorQADifficulty" AS ENUM ('easy', 'medium', 'hard');

ALTER TABLE "investor_qa" ADD COLUMN IF NOT EXISTS "difficulty" "InvestorQADifficulty" NOT NULL DEFAULT 'medium';

CREATE TABLE IF NOT EXISTS "investor_sessions" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "score" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "investor_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "investor_sessions_started_at_idx" ON "investor_sessions"("started_at");

CREATE TABLE IF NOT EXISTS "investor_session_answers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_answer" TEXT,
    "ai_feedback" TEXT,
    "score" INTEGER,

    CONSTRAINT "investor_session_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "investor_session_answers_session_id_idx" ON "investor_session_answers"("session_id");
CREATE INDEX IF NOT EXISTS "investor_session_answers_question_id_idx" ON "investor_session_answers"("question_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'investor_session_answers_session_id_fkey'
  ) THEN
    ALTER TABLE "investor_session_answers"
      ADD CONSTRAINT "investor_session_answers_session_id_fkey"
      FOREIGN KEY ("session_id") REFERENCES "investor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'investor_session_answers_question_id_fkey'
  ) THEN
    ALTER TABLE "investor_session_answers"
      ADD CONSTRAINT "investor_session_answers_question_id_fkey"
      FOREIGN KEY ("question_id") REFERENCES "investor_qa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "investor_qa" ("id", "question", "answer", "category", "difficulty", "sort_order", "created_at", "updated_at")
VALUES
  ('invqa_seed_013', 'Why will users switch from Airbnb?', 'We are not asking guests to wholesale-switch overnight. LECIPM wins on Québec-specific inventory, broker- and host-aligned workflows, and integrated trust (verification, messaging, payments) where we operate. The wedge is supply and operators who want a local marketplace—not a generic global catalog.', 'competition', 'hard', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('invqa_seed_014', 'What is your CAC?', 'CAC is modeled as marketing spend divided by net new users over the same window (see investor dashboard). As spend scales, we track CAC vs. revenue per active user and payback on BNHUB and broker paths separately.', 'financials', 'medium', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('invqa_seed_015', 'What is your moat?', 'Operational depth: listings + conversations + payments in one stack; broker CRM tied to real leads; host tools that generic listing sites do not ship. Data and workflow—not a single feature—create switching costs for serious operators.', 'strategy', 'hard', 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('invqa_seed_016', 'How do you scale supply?', 'Host and broker acquisition in priority cities, onboarding that gets listings to “bookable” fast, and growth loops from bookings and reviews. We measure published listings, drafts aging, and time-to-first booking by cohort.', 'growth', 'medium', 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('invqa_seed_017', 'What happens if competitors copy you?', 'Features copy; integrated marketplace position and liquidity in a region do not. We invest in trust, payments, and broker workflows so a clone without supply and operators is not substitutable in practice.', 'competition', 'hard', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
