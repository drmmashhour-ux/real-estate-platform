import type { LocaleCode } from "./locales";
import { flattenMessageTree, type MessageTree } from "./flatten-messages";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import ar from "@/locales/ar.json";

export type MessageDict = Record<string, string>;

export const MESSAGES: Record<LocaleCode, MessageDict> = {
  en: flattenMessageTree(en as unknown as MessageTree),
  fr: flattenMessageTree(fr as unknown as MessageTree),
  ar: flattenMessageTree(ar as unknown as MessageTree),
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
