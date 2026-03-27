import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { SpellLocale } from "./dictionary";

/** Bust cache after admin updates spell entries. */
export const SPELL_DICTIONARY_CACHE_TAG = "spell-dictionary";

/**
 * Lowercased allow/ignore words from DB for the active Hunspell locale (+ "both").
 */
export async function getSpellAllowWordsForLocale(locale: SpellLocale): Promise<string[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.spellDictionaryEntry.findMany({
        where: {
          OR: [{ locale: "both" }, { locale }],
        },
        select: { word: true },
      });
      const words: string[] = [];
      for (const r of rows) {
        const w = r.word.trim().toLowerCase();
        if (w) words.push(w);
      }
      return [...new Set(words)];
    },
    ["spell-allow", locale],
    { revalidate: 120, tags: [SPELL_DICTIONARY_CACHE_TAG] }
  )();
}

/** Union of admin words for en + fr (+ both), for routes that auto-detect language. */
export async function getMergedSpellAllowWords(): Promise<string[]> {
  const [en, fr] = await Promise.all([getSpellAllowWordsForLocale("en"), getSpellAllowWordsForLocale("fr")]);
  return [...new Set([...en, ...fr])];
}
