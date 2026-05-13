import { createLedgerAccount } from "../domain/ledger/accounts.js";
import { LedgerEngine } from "../domain/ledger/ledgerEngine.js";
import { MerchantService } from "../domain/merchants/merchantService.js";
import { PosService } from "../domain/pos/posService.js";
import { SettlementEngine } from "../domain/settlements/settlementEngine.js";
import { TransactionService } from "../domain/transactions/transactionService.js";
import { assertFinancialSafety } from "../safety/financialSafetyGuard.js";

export function createPaymentPlatform(currency = "USD") {
  assertFinancialSafety();
  const ledger = new LedgerEngine();
  const platformFeeAccount = ledger.addAccount(
    createLedgerAccount({ type: "platform_fee_account", currency }),
  );
  const settlementAccount = ledger.addAccount(
    createLedgerAccount({ type: "settlement_account", currency }),
  );
  const merchants = new MerchantService(ledger);
  const transactions = new TransactionService(
    ledger,
    merchants,
    platformFeeAccount,
    settlementAccount,
  );
  const settlements = new SettlementEngine(ledger, merchants, transactions, settlementAccount);
  const pos = new PosService(transactions);

  return {
    ledger,
    merchants,
    transactions,
    settlements,
    pos,
    accounts: {
      platformFeeAccount,
      settlementAccount,
    },
  };
}
