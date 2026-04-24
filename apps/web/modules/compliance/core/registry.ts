import type { ComplianceRule, ComplianceRuleCategory } from "@/modules/compliance/core/rule-types";
import { amlFraudRules } from "@/modules/compliance/oaciq/aml-fraud.rules";
import { recordsRegistersRules } from "@/modules/compliance/oaciq/records-registers.rules";
import { representationAdvertisingRules } from "@/modules/compliance/oaciq/representation-advertising.rules";
import { selectionOversightRules } from "@/modules/compliance/oaciq/selection-oversight.rules";
import { supervisionRules } from "@/modules/compliance/oaciq/supervision.rules";
import { trustAccountRules } from "@/modules/compliance/oaciq/trust-account.rules";
import { verificationInformationAdviceRules } from "@/modules/compliance/oaciq/verification-information-advice.rules";
import { licenceScopeRules } from "@/modules/compliance/oaciq/licence-scope.rules";
import { invoiceRules } from "@/modules/compliance/tax/invoice.rules";
import { revenueRecordsRules } from "@/modules/compliance/tax/revenue-records.rules";

const PACKS: ComplianceRule[][] = [
  licenceScopeRules,
  selectionOversightRules,
  representationAdvertisingRules,
  verificationInformationAdviceRules,
  amlFraudRules,
  recordsRegistersRules,
  trustAccountRules,
  supervisionRules,
  invoiceRules,
  revenueRecordsRules,
];

export function getAllRegisteredRules(): ComplianceRule[] {
  return PACKS.flat();
}

export function getRulesByCategory(): Record<ComplianceRuleCategory, ComplianceRule[]> {
  const map = {
    selection: [] as ComplianceRule[],
    representation: [] as ComplianceRule[],
    advertising: [] as ComplianceRule[],
    verification: [] as ComplianceRule[],
    aml: [] as ComplianceRule[],
    records: [] as ComplianceRule[],
    trust: [] as ComplianceRule[],
    tax: [] as ComplianceRule[],
    supervision: [] as ComplianceRule[],
    licence: [] as ComplianceRule[],
  };
  for (const r of getAllRegisteredRules()) {
    map[r.category].push(r);
  }
  return map;
}

/** Register additional packs at runtime (tests / future OACIQ sections). */
const dynamicPacks: ComplianceRule[][] = [];

export function registerComplianceRulePack(rules: ComplianceRule[]): void {
  dynamicPacks.push(rules);
}

export function getAllRulesIncludingDynamic(): ComplianceRule[] {
  return [...getAllRegisteredRules(), ...dynamicPacks.flat()];
}
