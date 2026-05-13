export const syriaFinancialTableNames = Object.freeze({
  transactions: "syria_financial_transactions",
  wallets: "syria_financial_wallets",
  walletLedgerEntries: "syria_financial_wallet_ledger_entries",
  payouts: "syria_financial_payouts",
  providerEvents: "syria_financial_provider_events",
  auditLogs: "syria_financial_audit_logs",
  paymentEvents: "syria_financial_payment_events",
  merchantProfiles: "syria_financial_merchant_profiles",
  merchantDocuments: "syria_financial_merchant_documents",
  riskSignals: "syria_financial_risk_signals",
});

export const syriaFinancialDatabaseSafety = Object.freeze({
  namespacePrefix: "syria_financial_",
  softDeleteField: "deletedAt",
  auditCompatible: true,
  migrationMode: "schema-preparation-only",
  destructiveChangesAllowed: false,
});
