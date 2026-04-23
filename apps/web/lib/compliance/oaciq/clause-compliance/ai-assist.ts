import type { ClauseValidationIssue } from "@/lib/compliance/oaciq/clause-compliance/types";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

/**
 * Deterministic coaching — never approves a clause; broker must finalize.
 */
export function deterministicClauseSuggestions(issues: ClauseValidationIssue[]): string[] {
  const s = new Set<string>();
  for (const i of issues) {
    if (i.code === "MISSING_PARAM") {
      s.add("Complétez chaque champ obligatoire (acteur, action, délai, avis, conséquence) avec des faits vérifiables.");
    }
    if (i.code === "AMBIGUOUS_LANGUAGE") {
      s.add("Remplacez les formules vagues par une date, un nombre de jours précis, ou un événement déclencheur clair.");
    }
    if (i.code === "UNKNOWN_CLAUSE_ID") {
      s.add("Choisissez une clause normalisée dans la bibliothèque ou faites réviser le texte par le conseiller juridique.");
    }
    if (i.code === "INACTIVE_CLAUSE") {
      s.add("Cette clause est désactivée dans la bibliothèque — utilisez la version à jour.");
    }
  }
  if (issues.some((x) => x.code === "DUAL_REPRESENTATION_FLAG")) {
    s.add("Vérifiez la divulgation écrite et le consentement éclairé avant toute entente de double représentation.");
  }
  return [...s];
}

const SYSTEM =
  "You assist Québec residential brokers with clause clarity. Suggest concise French improvements only. " +
  "Never state that a clause is legally valid. Output bullet points, max 5, French only.";

/** Optional LLM layer — suggestions only; requires broker review. */
export async function suggestClauseWordingWithAi(params: {
  narrativeFr: string;
  issuesSummary: string;
}): Promise<{ suggestions: string[]; aiAssisted: boolean }> {
  if (!isOpenAiConfigured() || !openai) {
    return { suggestions: [], aiAssisted: false };
  }
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Texte:\n${params.narrativeFr}\n\nProblèmes détectés:\n${params.issuesSummary}\n\nPropositions d'amélioration:`,
      },
    ],
  });
  const raw = res.choices[0]?.message?.content?.trim() ?? "";
  const bullets = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
  return { suggestions: bullets.slice(0, 5), aiAssisted: true };
}
