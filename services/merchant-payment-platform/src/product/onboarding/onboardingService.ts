import { randomUUID } from "node:crypto";
import type { MerchantService } from "../../domain/merchants/merchantService.js";
import type { Merchant } from "../../domain/merchants/types.js";
import { createAuditEvent, type SettlementDelay } from "../../domain/shared/types.js";

export type MockKycStatus = "not_started" | "pending_review" | "approved" | "rejected";

export interface OnboardingRecord {
  id: string;
  merchantId: string;
  kycStatus: MockKycStatus;
  approvalStatus: Merchant["status"];
  auditTrail: readonly ReturnType<typeof createAuditEvent>[];
  createdAt: Date;
  updatedAt: Date;
}

export class OnboardingService {
  private readonly recordsByMerchantId = new Map<string, OnboardingRecord>();

  constructor(private readonly merchants: MerchantService) {}

  registerMerchant(input: {
    displayName: string;
    currency: string;
    platformFeeBps?: number;
    settlementDelay?: SettlementDelay;
    correlationId: string;
  }): { merchant: Merchant; onboarding: OnboardingRecord } {
    const merchantInput: {
      displayName: string;
      currency: string;
      feeConfiguration?: { platformFeeBps: number };
      settlementRules?: { delay: SettlementDelay };
    } = {
      displayName: input.displayName,
      currency: input.currency,
    };
    if (input.platformFeeBps !== undefined) {
      merchantInput.feeConfiguration = { platformFeeBps: input.platformFeeBps };
    }
    if (input.settlementDelay !== undefined) {
      merchantInput.settlementRules = { delay: input.settlementDelay };
    }
    const merchant = this.merchants.onboardMerchant(merchantInput);
    const now = new Date();
    const record = Object.freeze({
      id: randomUUID(),
      merchantId: merchant.id,
      kycStatus: "not_started" as const,
      approvalStatus: merchant.status,
      auditTrail: Object.freeze([
        createAuditEvent({
          action: "merchant.onboarding.registered",
          actor: "onboarding",
          correlationId: input.correlationId,
          metadata: { merchantId: merchant.id },
        }),
      ]),
      createdAt: now,
      updatedAt: now,
    });
    this.recordsByMerchantId.set(merchant.id, record);
    return { merchant, onboarding: record };
  }

  submitMockKyc(merchantId: string, correlationId: string): OnboardingRecord {
    return this.updateRecord(merchantId, "pending_review", undefined, "merchant.kyc.submitted", correlationId);
  }

  approveMerchant(merchantId: string, correlationId: string): OnboardingRecord {
    this.merchants.updateMerchantStatus(merchantId, "active");
    return this.updateRecord(merchantId, "approved", "active", "merchant.approved", correlationId);
  }

  rejectMerchant(merchantId: string, correlationId: string): OnboardingRecord {
    this.merchants.updateMerchantStatus(merchantId, "rejected");
    return this.updateRecord(merchantId, "rejected", "rejected", "merchant.rejected", correlationId);
  }

  getRecord(merchantId: string): OnboardingRecord {
    const record = this.recordsByMerchantId.get(merchantId);
    if (!record) throw new Error(`Onboarding record not found: ${merchantId}.`);
    return record;
  }

  private updateRecord(
    merchantId: string,
    kycStatus: MockKycStatus,
    approvalStatus: Merchant["status"] | undefined,
    action: string,
    correlationId: string,
  ): OnboardingRecord {
    const current = this.getRecord(merchantId);
    const updated = Object.freeze({
      ...current,
      kycStatus,
      approvalStatus: approvalStatus ?? current.approvalStatus,
      auditTrail: Object.freeze([
        ...current.auditTrail,
        createAuditEvent({
          action,
          actor: "onboarding",
          correlationId,
          metadata: { merchantId },
        }),
      ]),
      updatedAt: new Date(),
    });
    this.recordsByMerchantId.set(merchantId, updated);
    return updated;
  }
}
