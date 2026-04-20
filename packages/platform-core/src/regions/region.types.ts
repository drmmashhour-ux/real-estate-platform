/**
 * Pure shared region model — no runtime coupling to apps.
 */

export type PlatformRegionCode = "ca_qc" | "ca_rest" | "sy" | "future_region";

export type PlatformRegionGroup = "canada" | "middle_east" | "international";

export type PlatformRegionAppTarget = "web" | "syria" | "shared";

export type RegionCapabilities = {
  legalHub: boolean;
  fraudEngine: boolean;
  trustScoring: boolean;
  autonomousPreview: boolean;
  controlledExecution: boolean;
  payouts: boolean;
  bnhub: boolean;
  brokerFlow: boolean;
  rentalFlow: boolean;
  shortTermRentalFlow: boolean;
};

export type RegionDefinition = {
  code: PlatformRegionCode;
  group: PlatformRegionGroup;
  label: string;
  appTarget: PlatformRegionAppTarget;
  defaultLocale: string;
  supportedLocales: readonly string[];
  currency: string;
  capabilities: RegionCapabilities;
};

export type RegionContext = {
  regionCode: PlatformRegionCode;
  locale: string;
  currency: string;
  appTarget: PlatformRegionAppTarget;
};
