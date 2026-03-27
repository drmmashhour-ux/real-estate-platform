import { franc } from "franc";
import { getBaseSpell, type SpellLocale } from "./dictionary";

export type SpellError = {
  word: string;
  start: number;
  end: number;
  suggestions: string[];
};

/**
 * Detect primary language for dictionary choice (English vs French).
 */
export function detectSpellLocale(text: string): SpellLocale {
  const t = text.trim();
  if (t.length < 16) return "en";
  const code = franc(t, { only: ["eng", "fra"] });
  return code === "fra" ? "fr" : "en";
}

function isCorrect(spell: ReturnType<typeof getBaseSpell>, word: string): boolean {
  if (word.length < 2) return true;
  if (spell.correct(word)) return true;
  const lower = word.toLowerCase();
  if (spell.correct(lower)) return true;
  if (lower !== word) {
    const cap = lower.charAt(0).toUpperCase() + lower.slice(1);
    if (spell.correct(cap)) return true;
  }
  return false;
}

function suggestionsFor(spell: ReturnType<typeof getBaseSpell>, word: string): string[] {
  let s = spell.suggest(word);
  if (s.length === 0) s = spell.suggest(word.toLowerCase());
  const list = s as string[];
  return [...new Set(list)].slice(0, 10);
}

/**
 * Token-wise spell check with character offsets (for highlighting).
 */
export function checkText(
  text: string,
  options: { locale?: SpellLocale; allowWords?: string[] } = {}
): { locale: SpellLocale; errors: SpellError[] } {
  const locale = options.locale ?? detectSpellLocale(text);
  const spell = getBaseSpell(locale);
  const allow = new Set((options.allowWords ?? []).map((w) => w.trim().toLowerCase()).filter(Boolean));

  const errors: SpellError[] = [];
  const re = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const word = m[0];
    const idx = m.index;
    if (word.length < 2) continue;
    if (/^[0-9]+$/.test(word)) continue;
    if (allow.has(word.toLowerCase())) continue;
    if (isCorrect(spell, word)) continue;
    errors.push({
      word,
      start: idx,
      end: idx + word.length,
      suggestions: suggestionsFor(spell, word),
    });
  }

  return { locale, errors };
}
