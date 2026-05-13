import type { LedgerEngine } from "../domain/ledger/ledgerEngine.js";
import type { MerchantService } from "../domain/merchants/merchantService.js";
import type { PosService } from "../domain/pos/posService.js";
import type { SettlementEngine } from "../domain/settlements/settlementEngine.js";
import type { TransactionService } from "../domain/transactions/transactionService.js";
import type { BrandConfiguration } from "./brand/brandConfig.js";
import { createBrandConfiguration } from "./brand/brandConfig.js";
import { createApiGateway } from "./api-gateway/apiGateway.js";
import { MerchantDashboardService } from "./dashboard/dashboardService.js";
import { OnboardingService } from "./onboarding/onboardingService.js";

export interface ProductLayerCore {
  ledger: LedgerEngine;
  merchants: MerchantService;
  transactions: TransactionService;
  settlements: SettlementEngine;
  pos: PosService;
  accounts: {
    platformFeeAccount: { id: string };
  };
}

export function createProductLayer(
  core: ProductLayerCore,
  brandOverrides: Partial<BrandConfiguration> = {},
) {
  const brand = createBrandConfiguration(brandOverrides);
  const onboarding = new OnboardingService(core.merchants);
  const dashboard = new MerchantDashboardService(
    core.merchants,
    core.transactions,
    core.settlements,
    core.ledger,
    brand,
    core.accounts.platformFeeAccount.id,
  );
  const apiGateway = createApiGateway({
    brand,
    pos: core.pos,
    dashboard,
    onboarding,
  });

  return {
    brand,
    onboarding,
    dashboard,
    apiGateway,
  };
}
