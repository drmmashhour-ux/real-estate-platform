import { createPaymentPlatform } from "../infrastructure/createPaymentPlatform.js";
import { ProductAuditLogger } from "./audit/auditLogger.js";
import { MockAuthService } from "./auth/authService.js";
import { ProductApiGateway } from "./api-gateway/productApiGateway.js";
import { InMemoryProductPersistence } from "./persistence/persistencePorts.js";
import { DashboardProductService } from "./services/dashboardProductService.js";
import { MerchantProductService } from "./services/merchantProductService.js";
import { SettlementProductService } from "./services/settlementProductService.js";
import { TransactionProductService } from "./services/transactionProductService.js";

export function createProductizedPlatform(currency = "USD") {
  const core = createPaymentPlatform(currency);
  const audit = new ProductAuditLogger();
  const persistence = new InMemoryProductPersistence();
  const auth = new MockAuthService("nexora-mock-auth-secret", persistence);
  const merchants = new MerchantProductService(core.merchants, persistence, audit);
  const transactions = new TransactionProductService(core.transactions, persistence, audit);
  const settlements = new SettlementProductService(core.settlements, persistence, audit);
  const dashboard = new DashboardProductService(
    core.merchants,
    core.transactions,
    core.settlements,
    core.ledger,
    core.accounts.platformFeeAccount.id,
  );
  const apiGateway = new ProductApiGateway({
    auth,
    audit,
    merchants,
    transactions,
    settlements,
    dashboard,
  });

  return {
    core,
    product: {
      apiGateway,
      auth,
      audit,
      persistence,
      services: {
        merchants,
        transactions,
        settlements,
        dashboard,
      },
    },
  };
}
