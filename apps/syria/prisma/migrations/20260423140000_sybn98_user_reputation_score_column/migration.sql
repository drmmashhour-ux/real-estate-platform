-- ORDER SYBNB-98 — persisted seller reputation aggregate (`SyriaAppUser.reputation_score`).
ALTER TABLE "syria_users" ADD COLUMN "reputation_score" INTEGER NOT NULL DEFAULT 0;
