import { z } from "zod";

export const KYC_STATUSES = ["not_started", "pending", "approved", "rejected", "requires_review"] as const;
export const VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected"] as const;
export const APPROVAL_STATUSES = ["draft", "submitted", "approved", "rejected", "suspended"] as const;

export const documentReferenceSchema = z.object({
  documentId: z.string().trim().min(1),
  documentType: z.enum(["identity", "business_registration", "bank_account", "address", "other"]),
  storageKey: z.string().trim().min(1),
  uploadedAt: z.date(),
  exposedPublicly: z.literal(false),
});

export const createMerchantProfileSchema = z.object({
  merchantId: z.string().uuid(),
  legalName: z.string().trim().min(1),
  countryCode: z.literal("SY"),
  documentReferences: z.array(documentReferenceSchema).default([]),
});

export const merchantVerificationUpdateSchema = z.object({
  kycStatus: z.enum(KYC_STATUSES).optional(),
  identityVerificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  bankAccountVerificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  approvalStatus: z.enum(APPROVAL_STATUSES).optional(),
  reviewedByAdminId: z.string().trim().min(1),
  reviewReason: z.string().trim().min(1),
});

export type DocumentReference = z.infer<typeof documentReferenceSchema>;
export type CreateMerchantProfileInput = z.infer<typeof createMerchantProfileSchema>;
export type MerchantVerificationUpdate = z.infer<typeof merchantVerificationUpdateSchema>;

export interface SyriaMerchantProfile {
  merchantId: string;
  legalName: string;
  countryCode: "SY";
  kycStatus: (typeof KYC_STATUSES)[number];
  identityVerificationStatus: (typeof VERIFICATION_STATUSES)[number];
  bankAccountVerificationStatus: (typeof VERIFICATION_STATUSES)[number];
  approvalStatus: (typeof APPROVAL_STATUSES)[number];
  documentReferences: readonly DocumentReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SecureDocumentStorage {
  createReference(reference: DocumentReference): Promise<DocumentReference>;
  getReference(documentId: string): Promise<DocumentReference | null>;
}
