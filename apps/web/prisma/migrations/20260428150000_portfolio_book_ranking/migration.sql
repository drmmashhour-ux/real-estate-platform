-- Portfolio book + properties for broker/investor ranking dashboard.

CREATE TABLE IF NOT EXISTS "portfolio_books" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "title" VARCHAR(240) NOT NULL DEFAULT 'Portfolio',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "portfolio_books_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_portfolio_books_owner" ON "portfolio_books"("owner_user_id");

ALTER TABLE "portfolio_books" ADD CONSTRAINT "portfolio_books_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "portfolio_properties" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(160),
    "cap_rate" DOUBLE PRECISION,
    "roi_percent" DOUBLE PRECISION,
    "monthly_cashflow_cents" INTEGER,
    "dscr" DOUBLE PRECISION,
    "neighborhood_score" DOUBLE PRECISION,
    "risk_level" VARCHAR(16),
    "current_value_cents" INTEGER,
    "ranking_score" DOUBLE PRECISION,
    "ranking_label" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "portfolio_properties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_portfolio_properties_book" ON "portfolio_properties"("portfolio_id");

ALTER TABLE "portfolio_properties" ADD CONSTRAINT "portfolio_properties_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
