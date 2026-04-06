import { flattenMessageTree, type MessageTree } from "@/lib/i18n/flatten-messages";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import ar from "@/locales/ar.json";

export type LocaleParityReport = {
  enKeyCount: number;
  frMissing: string[];
  arMissing: string[];
};

/**
 * Dev/CI: ensure fr/ar contain the same dot-keys as English (values may differ).
 */
export function validateLocaleKeyParity(): LocaleParityReport {
  const enFlat = flattenMessageTree(en as unknown as MessageTree);
  const frFlat = flattenMessageTree(fr as unknown as MessageTree);
  const arFlat = flattenMessageTree(ar as unknown as MessageTree);
  const enKeys = Object.keys(enFlat).sort();
  const frMissing = enKeys.filter((k) => frFlat[k] === undefined);
  const arMissing = enKeys.filter((k) => arFlat[k] === undefined);
  return { enKeyCount: enKeys.length, frMissing, arMissing };
}
