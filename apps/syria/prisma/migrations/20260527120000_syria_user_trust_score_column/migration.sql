-- Public trust band for SYBNB (cached on user row; event-driven updates only).

ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "trust_score" INTEGER NOT NULL DEFAULT 50;
