-- Bridge guided wizard `SeniorMatchProfile` with AI vertical `SeniorAiProfile`
-- AlterTable
ALTER TABLE "senior_ai_profiles" ADD COLUMN "senior_match_profile_id" VARCHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "senior_ai_profiles_senior_match_profile_id_key" ON "senior_ai_profiles"("senior_match_profile_id");

-- AddForeignKey
ALTER TABLE "senior_ai_profiles" ADD CONSTRAINT "senior_ai_profiles_senior_match_profile_id_fkey" FOREIGN KEY ("senior_match_profile_id") REFERENCES "senior_match_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
