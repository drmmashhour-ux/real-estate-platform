-- CreateTable
CREATE TABLE "property_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "listing_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_comparisons_user_id_key" ON "property_comparisons"("user_id");

-- AddForeignKey
ALTER TABLE "property_comparisons" ADD CONSTRAINT "property_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
