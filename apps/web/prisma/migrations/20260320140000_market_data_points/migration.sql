-- CreateTable
CREATE TABLE "market_data_points" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT,
    "property_type" TEXT NOT NULL,
    "avg_price_cents" INTEGER NOT NULL,
    "median_price_cents" INTEGER,
    "avg_rent_cents" INTEGER,
    "transactions" INTEGER,
    "inventory" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_data_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_data_points_city_property_type_date_idx" ON "market_data_points"("city", "property_type", "date");

-- CreateIndex
CREATE INDEX "market_data_points_city_date_idx" ON "market_data_points"("city", "date");
