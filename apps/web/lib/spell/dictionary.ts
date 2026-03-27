import fs from "fs";
import path from "path";
import { createRequire } from "module";
import nspell from "nspell";

export type SpellLocale = "en" | "fr";

const require = createRequire(import.meta.url);

export type SpellInstance = ReturnType<typeof nspell>;

function readEnglishDict(): { aff: string; dic: string } {
  const base = path.dirname(require.resolve("dictionary-en"));
  const aff = fs.readFileSync(path.join(base, "index.aff"), "utf8");
  const dic = fs.readFileSync(path.join(base, "index.dic"), "utf8");
  return { aff, dic };
}

function readFrenchDict(): { aff: string; dic: string } {
  const base = path.dirname(require.resolve("dictionary-fr"));
  const aff = fs.readFileSync(path.join(base, "index.aff"), "utf8");
  const dic = fs.readFileSync(path.join(base, "index.dic"), "utf8");
  return { aff, dic };
}

let enInstance: SpellInstance | null = null;
let frInstance: SpellInstance | null = null;

/**
 * Hunspell-backed checker (English or French) for Quebec / bilingual use.
 */
export function getBaseSpell(locale: SpellLocale): SpellInstance {
  if (locale === "fr") {
    if (!frInstance) {
      const { aff, dic } = readFrenchDict();
      frInstance = nspell(aff, dic);
    }
    return frInstance;
  }
  if (!enInstance) {
    const { aff, dic } = readEnglishDict();
    enInstance = nspell(aff, dic);
  }
  return enInstance;
}
