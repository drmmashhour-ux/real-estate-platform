export function buildReceiptNumber(): string {
  const now = new Date();
  return `RCPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}

export function buildFinancialEntryNumber(): string {
  const now = new Date();
  return `LEDGER-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}
