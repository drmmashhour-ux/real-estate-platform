import type { MessageLanguageGuess } from "@/lib/compliance/quebec/translation-engine";
import { detectMessageLanguage, translateEnToFrQuebecProfessional, translateFrToEnReference } from "@/lib/compliance/quebec/translation-engine";

export type BilingualContent = {
  originalText: string;
  originalLang: "EN" | "FR";
  frenchText: string;
  englishText: string;
  /** True when LLM produced the companion text or copy is already bilingual-quality. */
  validated: boolean;
};

function normalizeSourceLang(inputText: string, sourceLang: MessageLanguageGuess | "EN" | "FR"): "EN" | "FR" {
  if (sourceLang === "EN" || sourceLang === "FR") return sourceLang;
  const g = detectMessageLanguage(inputText);
  if (g === "FR") return "FR";
  return "EN";
}

/**
 * Builds FR + EN pair for broker-facing content. FR is always populated for Québec compliance paths.
 */
export async function generateBilingualContent(
  inputText: string,
  sourceLang: MessageLanguageGuess | "EN" | "FR" = "unknown",
  opts?: { includeEnglishWhenFrench?: boolean },
): Promise<BilingualContent> {
  const trimmed = inputText.trim();
  const lang = normalizeSourceLang(trimmed, sourceLang);

  if (lang === "FR") {
    const includeEn = opts?.includeEnglishWhenFrench !== false;
    const en = includeEn ? await translateFrToEnReference(trimmed) : { text: trimmed, source: "glossary" as const };
    const validated = en.source === "openai";
    return {
      originalText: trimmed,
      originalLang: "FR",
      frenchText: trimmed,
      englishText: en.text,
      validated,
    };
  }

  const fr = await translateEnToFrQuebecProfessional(trimmed);
  return {
    originalText: trimmed,
    originalLang: "EN",
    englishText: trimmed,
    frenchText: fr.text,
    validated: fr.source === "openai",
  };
}
