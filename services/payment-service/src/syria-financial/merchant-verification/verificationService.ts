import {
  createMerchantProfileSchema,
  merchantVerificationUpdateSchema,
  type CreateMerchantProfileInput,
  type MerchantVerificationUpdate,
  type SyriaMerchantProfile,
} from "./types.js";

export function createSyriaMerchantProfile(
  input: CreateMerchantProfileInput,
  createdAt: Date = new Date(),
): SyriaMerchantProfile {
  const parsed = createMerchantProfileSchema.parse(input);
  return {
    merchantId: parsed.merchantId,
    legalName: parsed.legalName,
    countryCode: "SY",
    kycStatus: "not_started",
    identityVerificationStatus: "unverified",
    bankAccountVerificationStatus: "unverified",
    approvalStatus: "draft",
    documentReferences: Object.freeze(parsed.documentReferences),
    createdAt,
    updatedAt: createdAt,
  };
}

export function applyMerchantVerificationUpdate(
  profile: SyriaMerchantProfile,
  update: MerchantVerificationUpdate,
  updatedAt: Date = new Date(),
): SyriaMerchantProfile {
  const parsed = merchantVerificationUpdateSchema.parse(update);
  return {
    ...profile,
    kycStatus: parsed.kycStatus ?? profile.kycStatus,
    identityVerificationStatus:
      parsed.identityVerificationStatus ?? profile.identityVerificationStatus,
    bankAccountVerificationStatus:
      parsed.bankAccountVerificationStatus ?? profile.bankAccountVerificationStatus,
    approvalStatus: parsed.approvalStatus ?? profile.approvalStatus,
    updatedAt,
  };
}
