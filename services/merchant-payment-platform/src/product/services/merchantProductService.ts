import type { MerchantService } from "../../domain/merchants/merchantService.js";
import type { Merchant } from "../../domain/merchants/types.js";
import type { ProductAuditLogger } from "../audit/auditLogger.js";
import type { ProductPersistencePort } from "../persistence/persistencePorts.js";

export class MerchantProductService {
  constructor(
    private readonly merchantCore: MerchantService,
    private readonly persistence: ProductPersistencePort,
    private readonly audit: ProductAuditLogger,
  ) {}

  registerMerchant(input: {
    displayName: string;
    currency: string;
    platformFeeBps?: number;
    settlementDelay?: "T+1" | "T+2";
    actorUserId: string;
    correlationId: string;
  }): Merchant {
    const merchant = this.merchantCore.onboardMerchant({
      displayName: input.displayName,
      currency: input.currency,
      ...(input.platformFeeBps === undefined
        ? {}
        : { feeConfiguration: { platformFeeBps: input.platformFeeBps } }),
      ...(input.settlementDelay === undefined
        ? {}
        : { settlementRules: { delay: input.settlementDelay } }),
    });
    this.persistMerchant(merchant);
    this.audit.record({
      category: "merchant_action",
      action: "merchant.registered",
      actorUserId: input.actorUserId,
      merchantId: merchant.id,
      correlationId: input.correlationId,
      metadata: { status: merchant.status },
    });
    return merchant;
  }

  activateMerchant(merchantId: string, actorUserId: string, correlationId: string): Merchant {
    return this.updateStatus(merchantId, "active", actorUserId, correlationId);
  }

  suspendMerchant(merchantId: string, actorUserId: string, correlationId: string): Merchant {
    return this.updateStatus(merchantId, "suspended", actorUserId, correlationId);
  }

  getMerchant(merchantId: string): Merchant {
    return this.merchantCore.getMerchant(merchantId);
  }

  private updateStatus(
    merchantId: string,
    status: Merchant["status"],
    actorUserId: string,
    correlationId: string,
  ): Merchant {
    const merchant = this.merchantCore.updateMerchantStatus(merchantId, status);
    this.persistMerchant(merchant);
    this.audit.record({
      category: "merchant_action",
      action: `merchant.${status}`,
      actorUserId,
      merchantId,
      correlationId,
      metadata: { status },
    });
    return merchant;
  }

  private persistMerchant(merchant: Merchant): void {
    this.persistence.saveMerchant({
      id: merchant.id,
      displayName: merchant.displayName,
      status: merchant.status,
      platformFeeBps: merchant.feeConfiguration.platformFeeBps,
      settlementDelay: merchant.settlementRules.delay,
      createdAt: merchant.createdAt,
    });
  }
}
