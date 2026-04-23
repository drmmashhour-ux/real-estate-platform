import { PlatformRole } from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { generateBilingualContent } from "@/lib/compliance/quebec/bilingual-content.service";
import { DEFAULT_QUEBEC_LANGUAGE_POLICY } from "@/lib/compliance/quebec/language-policy";
import { detectMessageLanguage } from "@/lib/compliance/quebec/translation-engine";

export type QuebecMessageMetadata = {
  quebecBilingual?: {
    sourceLang: "en" | "fr";
    displayEn: string;
    displayFr: string;
    validated: boolean;
  };
};

/** Attach FR companion when a broker sends English — UI may show both or client-preferred language. */
export async function buildBrokerMessageQuebecMetadata(params: {
  role: PlatformRole;
  body: string;
}): Promise<QuebecMessageMetadata | undefined> {
  if (!complianceFlags.quebecLanguageComplianceV1) return undefined;
  if (params.role !== PlatformRole.BROKER) return undefined;
  if (!DEFAULT_QUEBEC_LANGUAGE_POLICY.autoTranslateEnabled) return undefined;

  const lang = detectMessageLanguage(params.body);
  if (lang === "FR") return undefined;

  const bi = await generateBilingualContent(params.body, lang === "unknown" ? "EN" : "EN");
  return {
    quebecBilingual: {
      sourceLang: "en",
      displayEn: bi.englishText,
      displayFr: bi.frenchText,
      validated: bi.validated,
    },
  };
}
