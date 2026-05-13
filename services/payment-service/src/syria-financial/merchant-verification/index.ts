import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FinancialError } from "../common/errors.js";
import {
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  type FinancialActor,
  type FinancialMetadata,
  type RequestCorrelation,
} from "../common/types.js";
import { isSyriaFinancialFeatureEnabled, type SyriaFinancialFeatureFlags } from "../common/featureFlags.js";
import { sanitizeFinancialMetadata } from "../common/security.js";

export const kycStatuses = ["not_started", "pending", "approved", "rejected", "requires_more_info"] as const;
export const verificationStatuses = ["unverified", "pending", "verified", "rejected"] as const;

export const merchantDocumentReferenceSchema = z.object({
  id: financialIdSchema,
  type: z.enum(["identity", "commercial_register", "tax", "bank_account", "address", "other"]),
  storageRef: financialIdSchema,
  checksum: financialIdSchema.optional(),
  uploadedAt: z.string().datetime({ offset: true }),
  exposedPublicly: z.literal(false),
});

export const merchantProfileSchema = z.object({
  id: financialIdSchema,
  merchantId: financialIdSchema,
  displayName: z.string().trim().min(1).max(200),
  countryCode: z.literal("SY"),
  kycStatus: z.enum(kycStatuses),
  identityVerificationStatus: z.enum(verificationStatuses),
  bankAccountVerificationStatus: z.enum(verificationStatuses),
  approvalWorkflowStatus: z.enum(["draft", "in_review", "approved", "rejected"]),
  documentReferences: z.array(merchantDocumentReferenceSchema),
  metadata: financialMetadataSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type MerchantProfile = z.infer<typeof merchantProfileSchema>;
export type MerchantDocumentReference = z.infer<typeof merchantDocumentReferenceSchema>;

export function createMerchantProfile(
  input: Pick<MerchantProfile, "merchantId" | "displayName"> & { metadata?: FinancialMetadata },
  flags?: SyriaFinancialFeatureFlags,
): Readonly<MerchantProfile> {
  if (!isSyriaFinancialFeatureEnabled("FEATURE_SYRIA_KYC", flags)) {
    throw new FinancialError("FEATURE_DISABLED", "Syria merchant verification is disabled.", 403);
  }

  const timestamp = nowIso();
  return freezeFinancialRecord(
    merchantProfileSchema.parse({
      id: randomUUID(),
      merchantId: input.merchantId,
      displayName: input.displayName,
      countryCode: "SY",
      kycStatus: "not_started",
      identityVerificationStatus: "unverified",
      bankAccountVerificationStatus: "unverified",
      approvalWorkflowStatus: "draft",
      documentReferences: [],
      metadata: sanitizeFinancialMetadata(financialMetadataSchema.parse(input.metadata ?? {})),
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );
}

export function transitionMerchantVerification(
  profile: MerchantProfile,
  nextStatus: MerchantProfile["approvalWorkflowStatus"],
  actor: FinancialActor,
  correlation: RequestCorrelation,
): Readonly<MerchantProfile> {
  if (actor.actorType !== "admin" && nextStatus !== "in_review") {
    throw new FinancialError("UNAUTHORIZED", "Only admins can approve or reject merchant verification.", 403, correlation);
  }

  return freezeFinancialRecord(
    merchantProfileSchema.parse({
      ...profile,
      approvalWorkflowStatus: nextStatus,
      kycStatus: nextStatus === "approved" ? "approved" : nextStatus === "rejected" ? "rejected" : "pending",
      updatedAt: nowIso(),
    }),
  );
}
