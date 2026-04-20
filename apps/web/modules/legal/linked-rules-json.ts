/**
 * Helpers for `LegalCase.linked_rule_ids` JSON — supports legacy string[] or envelope `{ ruleIds, corpusMeta }`.
 */

export type LegalCaseLinkedRulesEnvelope = {
  ruleIds: string[];
  corpusMeta?: {
    slug?: string;
    tags?: string[];
    sourceType?: string;
    sourceReference?: string;
  };
};

export function extractRuleIdsFromLinkedRuleIdsJson(raw: unknown): string[] {
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return raw as string[];
  }
  if (raw && typeof raw === "object" && "ruleIds" in raw) {
    const ruleIds = (raw as LegalCaseLinkedRulesEnvelope).ruleIds;
    if (Array.isArray(ruleIds) && ruleIds.every((x) => typeof x === "string")) {
      return ruleIds;
    }
  }
  return [];
}

export function extractCorpusMetaFromLinkedRuleIdsJson(raw: unknown): LegalCaseLinkedRulesEnvelope["corpusMeta"] | null {
  if (!raw || typeof raw !== "object") return null;
  const corpusMeta = (raw as LegalCaseLinkedRulesEnvelope).corpusMeta;
  if (!corpusMeta || typeof corpusMeta !== "object") return null;
  return corpusMeta;
}
