import type { LocaleCode } from "./locales";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import ar from "@/locales/ar.json";
import es from "@/locales/es.json";

export type MessageDict = Record<string, string>;

export const MESSAGES: Record<LocaleCode, MessageDict> = {
  en: en as MessageDict,
  fr: fr as MessageDict,
  ar: ar as MessageDict,
  es: es as MessageDict,
};

const SELLER_DECLARATION_TITLE_KEY = "sellerDeclaration.title";

/** Server or client: localized title for the BNHub seller declaration flow. */
export function getSellerDeclarationTitle(locale: LocaleCode): string {
  return (
    MESSAGES[locale]?.[SELLER_DECLARATION_TITLE_KEY] ??
    MESSAGES.en[SELLER_DECLARATION_TITLE_KEY] ??
    "Seller Declaration"
  );
}
