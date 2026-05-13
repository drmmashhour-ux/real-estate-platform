import type { BrandConfiguration } from "../brand/brandConfig.js";
import type { MerchantDashboardView } from "./dashboardService.js";

export function renderMerchantDashboardHtml(
  dashboard: MerchantDashboardView,
  brand: BrandConfiguration,
): string {
  const transactions = dashboard.transactions
    .map(
      (transaction) =>
        `<tr><td>${escapeHtml(transaction.id)}</td><td>${escapeHtml(transaction.status)}</td><td>${escapeHtml(transaction.provider)}</td><td>${escapeHtml(transaction.amount)}</td></tr>`,
    )
    .join("");
  const settlements = dashboard.settlements
    .map(
      (settlement) =>
        `<tr><td>${escapeHtml(settlement.id)}</td><td>${escapeHtml(settlement.status)}</td><td>${escapeHtml(settlement.delay)}</td><td>${settlement.transactionCount}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(brand.brandName)} Merchant Dashboard</title>
  <style>
    body { margin: 0; font-family: ${brand.theme.tokens.typography.fontFamily}; background: ${brand.theme.tokens.colors.background}; color: ${brand.theme.tokens.colors.text}; }
    main { padding: ${brand.theme.tokens.spacing.xl}; }
    .card { background: ${brand.theme.tokens.colors.surface}; border-radius: ${brand.theme.borderRadius}; padding: ${brand.theme.tokens.spacing.lg}; margin-bottom: ${brand.theme.tokens.spacing.lg}; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: ${brand.theme.tokens.spacing.md}; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: ${brand.theme.tokens.spacing.sm}; border-bottom: 1px solid #E5E7EB; }
    .muted { color: ${brand.theme.tokens.colors.mutedText}; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.brandName)} logo" height="32" />
      <h1>${escapeHtml(dashboard.merchant.displayName)}</h1>
      <p class="muted">Status: ${escapeHtml(dashboard.merchant.status)}</p>
    </section>
    <section class="grid">
      <div class="card"><h2>Daily volume</h2><strong>${escapeHtml(dashboard.analytics.dailyVolume)}</strong></div>
      <div class="card"><h2>Weekly volume</h2><strong>${escapeHtml(dashboard.analytics.weeklyVolume)}</strong></div>
      <div class="card"><h2>Fees</h2><strong>${escapeHtml(dashboard.fees.feeAccountBalance)}</strong></div>
    </section>
    <section class="card">
      <h2>Transactions</h2>
      <table><thead><tr><th>ID</th><th>Status</th><th>Provider</th><th>Amount</th></tr></thead><tbody>${transactions}</tbody></table>
    </section>
    <section class="card">
      <h2>Settlements</h2>
      <table><thead><tr><th>ID</th><th>Status</th><th>Delay</th><th>Transactions</th></tr></thead><tbody>${settlements}</tbody></table>
    </section>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
