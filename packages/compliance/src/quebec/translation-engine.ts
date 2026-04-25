import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type MessageLanguageGuess = "EN" | "FR" | "unknown";

/** High-value terminology — professional Québec real estate usage (not exhaustive). */
export const QUEBEC_REAL_ESTATE_GLOSSARY_EN_TO_FR: readonly [RegExp, string][] = [
  [/\boffer\b/gi, "promesse d'achat"],
  [/\blistings?\b/gi, "propriété à vendre"],
  [/\bclosing\b/gi, "signature chez le notaire"],
  [/\bhome inspection\b/gi, "inspection préachat"],
  [/\breal estate broker\b/gi, "courtier immobilier résidentiel"],
  [/\bresidential broker\b/gi, "courtier immobilier résidentiel"],
  [/\bpurchase agreement\b/gi, "contrat de vente"],
  [/\bseller disclosure\b/gi, "déclaration du vendeur"],
];

const FR_DIACRITICS = /[àâäéèêëïîôùûüç]/i;
const FR_FUNCTION_WORDS = /\b(le|la|les|des|une|un|et|avec|sans|maison|condo|propriété|visite|notaire)\b/i;
const EN_FUNCTION_WORDS = /\b(the|and|with|this|that|house|home|visit|schedule|please)\b/i;

export function detectMessageLanguage(text: string): MessageLanguageGuess {
  const t = text.trim();
  if (!t) return "unknown";
  const frMarks = (t.match(FR_DIACRITICS) ?? []).length;
  const ratio = frMarks / Math.max(t.length, 1);
  if (ratio > 0.02 || FR_FUNCTION_WORDS.test(t)) return "FR";
  if (EN_FUNCTION_WORDS.test(t) && frMarks === 0) return "EN";
  return "unknown";
}

export function applyQuebecRealEstateGlossaryEnToFr(text: string): string {
  let out = text;
  for (const [re, rep] of QUEBEC_REAL_ESTATE_GLOSSARY_EN_TO_FR) {
    out = out.replace(re, rep);
  }
  return out;
}

const SYSTEM_QC_FR = `You are a senior Québec residential real estate editor. Translate the user's message into formal French (Québec).
Rules:
- Use standard Québec real estate terminology: "promesse d'achat" for offer to purchase, "propriété à vendre" for listing, "courtier immobilier résidentiel" for broker, "signature chez le notaire" for closing.
- Avoid literal calques; keep tone professional, clear, and client-friendly.
- Do not add disclaimers or meta commentary. Output only the French text.`;

const SYSTEM_QC_EN = `You translate formal Québec French real estate messages into clear professional English for reference.
Use North American real estate English. Output only the English text.`;

async function openAiTranslate(system: string, userText: string): Promise<string | null> {
  if (!isOpenAiConfigured() || !openai) return null;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userText },
    ],
  });
  const out = res.choices[0]?.message?.content?.trim();
  return out && out.length > 0 ? out : null;
}

/** Professional FR from English — LLM when configured, else glossary-first draft. */
export async function translateEnToFrQuebecProfessional(text: string): Promise<{ text: string; source: "openai" | "glossary" }> {
  const llm = await openAiTranslate(SYSTEM_QC_FR, text);
  if (llm) return { text: llm, source: "openai" };
  return { text: applyQuebecRealEstateGlossaryEnToFr(text), source: "glossary" };
}

export async function translateFrToEnReference(text: string): Promise<{ text: string; source: "openai" | "glossary" }> {
  const llm = await openAiTranslate(SYSTEM_QC_EN, text);
  if (llm) return { text: llm, source: "openai" };
  return { text, source: "glossary" };
}
