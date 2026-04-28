-- ORDER SYBNB-52 — Hotel CRM (`SybnbHotelLead`)

CREATE TYPE "SybnbHotelLeadStatus" AS ENUM ('new', 'contacted', 'interested', 'onboarded', 'active', 'paying', 'lost');

CREATE TABLE "sybnb_hotel_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" "SybnbHotelLeadStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sybnb_hotel_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sybnb_hotel_leads_status_idx" ON "sybnb_hotel_leads"("status");
CREATE INDEX "sybnb_hotel_leads_city_idx" ON "sybnb_hotel_leads"("city");
CREATE INDEX "sybnb_hotel_leads_created_at_idx" ON "sybnb_hotel_leads"("created_at");
