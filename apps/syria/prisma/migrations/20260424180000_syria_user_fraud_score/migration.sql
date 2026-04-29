-- Lightweight SYBNB fraud scoring on SyriaAppUser (no extra tables).
ALTER TABLE "syria_users" ADD COLUMN "fraud_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "syria_users" ADD COLUMN "fraud_flag" BOOLEAN NOT NULL DEFAULT false;
