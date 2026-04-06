import { getSellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";
import type { ClientSectionExplanation } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

const DISCLAIMER =
  "This explanation describes what each part of the form is for. It is not legal advice. Ask a qualified professional if you need advice for your situation.";

function formatFieldCheck(fieldKey: string, label: string, payload: Record<string, unknown>): string | null {
  const v = payload[fieldKey];
  const empty =
    v === undefined ||
    v === null ||
    (typeof v === "string" && !v.trim()) ||
    (typeof v === "boolean" ? false : !String(v ?? "").trim());
  if (empty) return `Confirm "${label}" is complete and accurate.`;
  return null;
}

/**
 * Grounded, schema-based copy only—no generative legal advice.
 */
export function buildClientSectionExplanation(sectionKey: string, payload: Record<string, unknown>): ClientSectionExplanation {
  const section = getSellerDeclarationSections(payload).find((s) => s.key === sectionKey);
  if (!section) {
    return {
      sectionKey,
      whatItMeans: "This part of the seller declaration collects factual details about the property.",
      whyItMatters: "Buyers rely on clear disclosures to understand what they are considering.",
      whatToCheck: ["Read each answer slowly.", "Fix typos and make sure dates and locations match what you know."],
      disclaimer: DISCLAIMER,
    };
  }

  const whatToCheck: string[] = [];
  for (const f of section.fields) {
    if (f.conditional) {
      const condVal = payload[f.conditional.fieldKey];
      if (condVal !== f.conditional.equals) continue;
    }
    const tip = formatFieldCheck(f.key, f.label, payload);
    if (tip) whatToCheck.push(tip);
    else if (f.helpText) whatToCheck.push(`${f.label}: ${f.helpText}`);
  }
  if (!whatToCheck.length) {
    whatToCheck.push("Compare the answers here with your own knowledge of the property.");
  }

  return {
    sectionKey,
    whatItMeans: `${section.label}. ${section.description}`,
    whyItMatters:
      "This helps everyone see the same facts about the property before you sign. Clear answers reduce confusion later.",
    whatToCheck: whatToCheck.slice(0, 8),
    disclaimer: DISCLAIMER,
  };
}
