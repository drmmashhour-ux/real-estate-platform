-- CreateTable
CREATE TABLE "spell_dictionary_entries" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'both',
    "word" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'allow',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spell_dictionary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spell_dictionary_entries_word_locale_kind_key" ON "spell_dictionary_entries"("word", "locale", "kind");

-- CreateIndex
CREATE INDEX "spell_dictionary_entries_locale_idx" ON "spell_dictionary_entries"("locale");
