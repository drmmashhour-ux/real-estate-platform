import { checkText } from "./check";
import type { SpellLocale } from "./dictionary";

/** Very small typo map applied before Hunspell suggestions. */
const COMMON_FIXES: Record<string, string> = {
  teh: "the",
  adn: "and",
  recieve: "receive",
  accomodation: "accommodation",
  definately: "definitely",
  occured: "occurred",
  untill: "until",
  wirh: "with",
  montral: "Montreal",
  monreal: "Montreal",
};

function applyCommonMap(text: string): string {
  let out = text;
  for (const [bad, good] of Object.entries(COMMON_FIXES)) {
    const re = new RegExp(`(?<![\\p{L}\\p{M}])${bad}(?![\\p{L}\\p{M}])`, "giu");
    out = out.replace(re, good);
  }
  return out;
}

/**
 * Auto-correct: common replacements first, then first Hunspell suggestion per token (end → start).
 */
export function correctText(
  text: string,
  options: { locale?: SpellLocale; allowWords?: string[] } = {}
): string {
  let out = applyCommonMap(text);
  const { errors } = checkText(out, options);
  const sorted = [...errors].sort((a, b) => b.start - a.start);
  for (const e of sorted) {
    const rep = e.suggestions[0];
    if (!rep) continue;
    out = out.slice(0, e.start) + rep + out.slice(e.end);
  }
  return out;
}
