export interface MerchantDashboardReadModel {
  merchantId: string;
  merchantName: string;
  transactions: readonly DashboardTransactionRead[];
  settlements: readonly DashboardSettlementRead[];
  feeBalanceMinor: number;
  revenueMinor: number;
  platformFeeBps: number;
  dailyVolumeMinor: number;
  weeklyVolumeMinor: number;
  currency: string;
}

export interface DashboardTransactionRead {
  id: string;
  merchantId: string;
  provider: string;
  money: {
    amountMinor: number;
    currency: string;
  };
  status: string;
  ledgerTransactionIds: readonly string[];
  createdAt: Date;
}

export interface DashboardSettlementRead {
  id: string;
  merchantId: string;
  delay: string;
  transactionIds: readonly string[];
  ledgerTransactionIds: readonly string[];
  scheduledSettlementDate: Date;
  status: string;
}

export function createDashboardReadModel(input: {
  merchantId: string;
  merchantName: string;
  transactions: readonly DashboardTransactionRead[];
  settlements: readonly DashboardSettlementRead[];
  feeBalanceMinor: number;
  platformFeeBps?: number;
  now?: Date;
  currency?: string;
}): MerchantDashboardReadModel {
  const now = input.now ?? new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7);
  const dailyVolumeMinor = input.transactions
    .filter((transaction) => transaction.createdAt >= startOfDay)
    .reduce((sum, transaction) => sum + transaction.money.amountMinor, 0);
  const weeklyVolumeMinor = input.transactions
    .filter((transaction) => transaction.createdAt >= startOfWeek)
    .reduce((sum, transaction) => sum + transaction.money.amountMinor, 0);
  const revenueMinor = input.transactions
    .filter((transaction) => ["recorded", "settled", "completed"].includes(transaction.status))
    .reduce((sum, transaction) => sum + transaction.money.amountMinor, 0);

  return Object.freeze({
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    transactions: Object.freeze([...input.transactions]),
    settlements: Object.freeze([...input.settlements]),
    feeBalanceMinor: input.feeBalanceMinor,
    revenueMinor,
    platformFeeBps: input.platformFeeBps ?? 0,
    dailyVolumeMinor,
    weeklyVolumeMinor,
    currency: input.currency ?? input.transactions[0]?.money.currency ?? "USD",
  });
}
