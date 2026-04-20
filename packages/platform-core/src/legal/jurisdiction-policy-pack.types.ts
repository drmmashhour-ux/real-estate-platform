import type { PlatformRegionCode } from "../regions/region.types";

export type JurisdictionPolicyPack = {
  regionCode: PlatformRegionCode;
  legalPackId: string;
  checklistEnabled: boolean;
  trustRulesEnabled: boolean;
  fraudRulesEnabled: boolean;
  rankingRulesEnabled: boolean;
  notes: readonly string[];
};
