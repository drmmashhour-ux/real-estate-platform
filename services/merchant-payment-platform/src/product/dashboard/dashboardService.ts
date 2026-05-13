import type { LedgerEngine } from "../../domain/ledger/ledgerEngine.js";
import type { MerchantService } from "../../domain/merchants/merchantService.js";
import type { SettlementEngine } from "../../domain/settlements/settlementEngine.js";
import type { TransactionService } from "../../domain/transactions/transactionService.js";
import type { BrandConfiguration } from "../brand/brandConfig.js";
import { formatBrandMoney } from "../brand/brandConfig.js";

export interface MerchantDashboardView {
  merchant: {
    id: string;
    displayName: string;
    status: string;
  };
  transactions: readonly {
    id: string;
    status: string;
    provider: string;
    amount: string;
    ledgerTransactionIds: readonly string[];
    createdAt: string;
  }[];
  settlements: readonly {
    id: string;
    status: string;
    delay: string;
    transactionCount: number;
    scheduledSettlementDate: string;
  }[];
  fees: {
    feeAccountBalance: string;
    feeAccountBalanceMinor: number;
  };
  analytics: {
    dailyVolume: string;
    weeklyVolume: string;
    dailyVolumeMinor: number;
    weeklyVolumeMinor: number;
    transactionCount: number;
  };
}

export class MerchantDashboardService {
  constructor(
    private readonly merchants: MerchantService,
    private readonly transactions: TransactionService,
    private readonly settlements: SettlementEngine,
    private readonly ledger: LedgerEngine,
    private readonly brand: BrandConfiguration,
    private readonly platformFeeAccountId: string,
  ) {}

  getDashboard(merchantId: string, now: Date = new Date()): MerchantDashboardView {
    const merchant = this.merchants.getMerchant(merchantId);
    const merchantTransactions = this.transactions
      .listTransactions()
      .filter((transaction) => transaction.merchantId === merchantId);
    const merchantSettlements = this.settlements
      .listBatches()
      .filter((batch) => batch.merchantId === merchantId);
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7);

    const dailyVolumeMinor = merchantTransactions
      .filter((transaction) => transaction.createdAt >= startOfDay)
      .reduce((sum, transaction) => sum + transaction.money.amountMinor, 0);
    const weeklyVolumeMinor = merchantTransactions
      .filter((transaction) => transaction.createdAt >= startOfWeek)
      .reduce((sum, transaction) => sum + transaction.money.amountMinor, 0);
    const feeAccountBalanceMinor = this.ledger.getAccountBalance(this.platformFeeAccountId);

    return Object.freeze({
      merchant: {
        id: merchant.id,
        displayName: merchant.displayName,
        status: merchant.status,
      },
      transactions: Object.freeze(
        merchantTransactions.map((transaction) => ({
          id: transaction.id,
          status: transaction.status,
          provider: transaction.provider,
          amount: formatBrandMoney(transaction.money.amountMinor, this.brand),
          ledgerTransactionIds: Object.freeze([...transaction.ledgerTransactionIds]),
          createdAt: transaction.createdAt.toISOString(),
        })),
      ),
      settlements: Object.freeze(
        merchantSettlements.map((batch) => ({
          id: batch.id,
          status: batch.status,
          delay: batch.delay,
          transactionCount: batch.transactionIds.length,
          scheduledSettlementDate: batch.scheduledSettlementDate.toISOString(),
        })),
      ),
      fees: {
        feeAccountBalance: formatBrandMoney(feeAccountBalanceMinor, this.brand),
        feeAccountBalanceMinor,
      },
      analytics: {
        dailyVolume: formatBrandMoney(dailyVolumeMinor, this.brand),
        weeklyVolume: formatBrandMoney(weeklyVolumeMinor, this.brand),
        dailyVolumeMinor,
        weeklyVolumeMinor,
        transactionCount: merchantTransactions.length,
      },
    });
  }
}
