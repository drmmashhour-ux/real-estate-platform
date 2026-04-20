/**
 * Jurisdiction policy packs — deterministic; no I/O.
 */
import type { JurisdictionPolicyPack, PlatformRegionCode } from "@lecipm/platform-core";

const CA_QC: JurisdictionPolicyPack = {
  regionCode: "ca_qc",
  legalPackId: "qc_civil_dppd_quebec",
  checklistEnabled: true,
  trustRulesEnabled: true,
  fraudRulesEnabled: true,
  rankingRulesEnabled: true,
  notes: ["quebec_compliance_stack_enabled_for_primary_market"],
};

const SY: JurisdictionPolicyPack = {
  regionCode: "sy",
  legalPackId: "sy_regional_readonly_v1",
  checklistEnabled: false,
  trustRulesEnabled: true,
  fraudRulesEnabled: true,
  rankingRulesEnabled: false,
  notes: [
    "quebec_legal_checklist_not_applied",
    "execution_and_payouts_gated_by_region_capabilities",
  ],
};

const BY_CODE: Record<string, JurisdictionPolicyPack> = {
  ca_qc: CA_QC,
  sy: SY,
};

export function getJurisdictionPolicyPack(regionCode: string): JurisdictionPolicyPack {
  const raw = typeof regionCode === "string" ? regionCode.trim().toLowerCase() : "";
  const k = raw === "syria" ? "sy" : raw;
  return (
    BY_CODE[k] ?? {
      regionCode: "future_region" as PlatformRegionCode,
      legalPackId: "fallback_minimal",
      checklistEnabled: false,
      trustRulesEnabled: false,
      fraudRulesEnabled: false,
      rankingRulesEnabled: false,
      notes: ["jurisdiction_pack_unknown_using_fallback"],
    }
  );
}
