import type { MerchantStatus, SettlementDelay } from "../shared/types.js";
import type { LedgerAccount } from "../ledger/types.js";

export interface MerchantFeeConfiguration {
  platformFeeBps: number;
}

export interface MerchantSettlementRules {
  delay: SettlementDelay;
}

export interface Merchant {
  id: string;
  displayName: string;
  status: MerchantStatus;
  feeConfiguration: MerchantFeeConfiguration;
  settlementRules: MerchantSettlementRules;
  accounts: {
    merchantAccount: LedgerAccount;
  };
  createdAt: Date;
  updatedAt: Date;
}
