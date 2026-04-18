export type OfficeSettingsPatch = {
  defaultCurrency?: string;
  taxConfig?: Record<string, unknown>;
  commissionConfig?: Record<string, unknown>;
  payoutConfig?: Record<string, unknown>;
  billingConfig?: Record<string, unknown>;
  featureConfig?: Record<string, unknown>;
};

export type OfficeMemberPatch = {
  role?: import("@prisma/client").OfficeMembershipRole;
  membershipStatus?: import("@prisma/client").OfficeMembershipStatus;
  metadata?: Record<string, unknown>;
};
