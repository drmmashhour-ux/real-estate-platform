import type { MerchantDashboardReadModel } from "../dashboard/viewModels.js";
import type { ReceiptViewModel } from "../receipt/receiptScaffold.js";

export interface NexoraApiClient {
  getDashboard(merchantId: string): Promise<MerchantDashboardReadModel>;
  createPosTransaction(input: {
    merchantId: string;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; status: "pending" }>;
  confirmPosTransaction(transactionId: string): Promise<{ transactionId: string; status: "success" }>;
  getReceipt(transactionId: string): Promise<ReceiptViewModel>;
}

export class MockNexoraApiClient implements NexoraApiClient {
  async getDashboard(merchantId: string): Promise<MerchantDashboardReadModel> {
    return {
      merchantId,
      merchantName: "Nexora Demo Merchant",
      transactions: [],
      settlements: [],
      feeBalanceMinor: 0,
      revenueMinor: 0,
      platformFeeBps: 0,
      dailyVolumeMinor: 0,
      weeklyVolumeMinor: 0,
      currency: "USD",
    };
  }

  async createPosTransaction(input: {
    merchantId: string;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; status: "pending" }> {
    return {
      transactionId: `mock_txn_${input.idempotencyKey}`,
      status: "pending",
    };
  }

  async confirmPosTransaction(transactionId: string): Promise<{ transactionId: string; status: "success" }> {
    return { transactionId, status: "success" };
  }

  async getReceipt(transactionId: string): Promise<ReceiptViewModel> {
    return {
      merchantName: "Nexora Demo Merchant",
      amountMinor: 0,
      currency: "USD",
      timestamp: new Date(),
      transactionId,
      status: "success",
    };
  }
}
