export type PremiumEligibilityResult = {
  premiumEligible: boolean;
  eligibilityReasons: string[];
  missingRequirements: string[];
  premiumRiskFlags: string[];
  displayableUpgradeGuidance: string[];
};
