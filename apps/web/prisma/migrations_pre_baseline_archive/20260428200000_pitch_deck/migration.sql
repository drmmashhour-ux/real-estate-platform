-- LECIPM investor pitch deck persistence

CREATE TABLE "pitch_decks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pitch_decks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pitch_decks_created_at_idx" ON "pitch_decks"("created_at");

CREATE TABLE "pitch_deck_slides" (
    "id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "pitch_deck_slides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pitch_deck_slides_deck_id_order_idx" ON "pitch_deck_slides"("deck_id", "order");

ALTER TABLE "pitch_deck_slides" ADD CONSTRAINT "pitch_deck_slides_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
