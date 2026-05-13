import { randomUUID } from "node:crypto";
import { createLedgerAccount } from "../ledger/accounts.js";
import type { LedgerEngine } from "../ledger/ledgerEngine.js";
import type { Merchant, MerchantFeeConfiguration, MerchantSettlementRules } from "./types.js";

export class MerchantService {
  private readonly merchants = new Map<string, Merchant>();

  constructor(private readonly ledger: LedgerEngine) {}

  onboardMerchant(input: {
    displayName: string;
    currency: string;
    feeConfiguration?: MerchantFeeConfiguration;
    settlementRules?: MerchantSettlementRules;
  }): Merchant {
    if (!input.displayName.trim()) throw new Error("Merchant displayName is required.");
    const merchantAccount = this.ledger.addAccount(
      createLedgerAccount({
        type: "merchant_account",
        currency: input.currency,
      }),
    );
    const now = new Date();
    const merchant = Object.freeze({
      id: randomUUID(),
      displayName: input.displayName,
      status: "pending" as const,
      feeConfiguration: Object.freeze(input.feeConfiguration ?? { platformFeeBps: 250 }),
      settlementRules: Object.freeze(input.settlementRules ?? { delay: "T+1" as const }),
      accounts: Object.freeze({ merchantAccount }),
      createdAt: now,
      updatedAt: now,
    });
    this.merchants.set(merchant.id, merchant);
    return merchant;
  }

  updateMerchantStatus(merchantId: string, status: Merchant["status"]): Merchant {
    const merchant = this.getMerchant(merchantId);
    const updated = Object.freeze({ ...merchant, status, updatedAt: new Date() });
    this.merchants.set(merchantId, updated);
    return updated;
  }

  getMerchant(merchantId: string): Merchant {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) throw new Error(`Merchant not found: ${merchantId}.`);
    return merchant;
  }
}
