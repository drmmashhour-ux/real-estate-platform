-- ORDER SYBNB-95 — on-platform listing messages (guest → seller)

CREATE TABLE "listing_messages" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "sender_name" TEXT,
    "sender_phone" TEXT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_messages_listing_id_idx" ON "listing_messages"("listing_id");

ALTER TABLE "listing_messages" ADD CONSTRAINT "listing_messages_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
