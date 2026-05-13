import type { LedgerEngine } from "../../domain/ledger/ledgerEngine.js";
import type { MerchantService } from "../../domain/merchants/merchantService.js";
import type { SettlementEngine } from "../../domain/settlements/settlementEngine.js";
import type { TransactionService } from "../../domain/transactions/transactionService.js";
import { createDashboardReadModel, type MerchantDashboardReadModel } from "../dashboard/viewModels.js";

export class DashboardProductService {
  constructor(
    private readonly merchantCore: MerchantService,
    private readonly transactionCore: TransactionService,
    private readonly settlementCore: SettlementEngine,
    private readonly ledger: LedgerEngine,
    private readonly platformFeeAccountId: string,
  ) {}

  getMerchantDashboard(merchantId: string): MerchantDashboardReadModel {
    const merchant = this.merchantCore.getMerchant(merchantId);
    const transactions = this.transactionCore
      .listTransactions()
      .filter((transaction) => transaction.merchantId === merchantId);
    const settlements = this.settlementCore
      .listBatches()
      .filter((settlement) => settlement.merchantId === merchantId);
    return createDashboardReadModel({
      merchantId,
      merchantName: merchant.displayName,
      transactions,
      settlements,
      feeBalanceMinor: this.ledger.getAccountBalance(this.platformFeeAccountId),
      platformFeeBps: merchant.feeConfiguration.platformFeeBps,
      currency: merchant.accounts.merchantAccount.currency,
    });
  }
}
