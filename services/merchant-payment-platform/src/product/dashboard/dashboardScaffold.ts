import type { BrandIdentity } from "../brand/brandConfig.js";
import { escapeHtml, renderCurrency } from "../ui/html.js";
import { renderDashboardShell } from "../ui/layout/dashboardShell.js";
import type { MerchantDashboardReadModel } from "./viewModels.js";

export function renderOverviewPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  const body = `<section class="grid">
    ${metricCard("Daily volume", renderCurrency(view.dailyVolumeMinor, view.currency))}
    ${metricCard("Weekly volume", renderCurrency(view.weeklyVolumeMinor, view.currency))}
    ${metricCard("Fees", renderCurrency(view.feeBalanceMinor, view.currency))}
  </section>`;
  return renderDashboardShell({
    brand,
    title: "Overview",
    subtitle: escapeHtml(view.merchantName),
    activeSection: "Overview",
    body,
  });
}

export function renderTransactionsPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  const rows = view.transactions
    .map(
      (transaction) =>
        `<tr><td>${escapeHtml(transaction.id)}</td><td>${escapeHtml(transaction.status)}</td><td>${escapeHtml(transaction.provider)}</td><td>${renderCurrency(transaction.money.amountMinor, transaction.money.currency)}</td></tr>`,
    )
    .join("");
  return renderDashboardShell({
    brand,
    title: "Transactions",
    subtitle: "Read-only ledger-backed transaction history",
    activeSection: "Transactions",
    body: `<section class="card"><table><thead><tr><th>ID</th><th>Status</th><th>Provider</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table></section>`,
  });
}

export function renderSettlementsPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  const rows = view.settlements
    .map(
      (settlement) =>
        `<tr><td>${escapeHtml(settlement.id)}</td><td>${escapeHtml(settlement.status)}</td><td>${escapeHtml(settlement.delay)}</td><td>${settlement.transactionIds.length}</td></tr>`,
    )
    .join("");
  return renderDashboardShell({
    brand,
    title: "Settlements",
    subtitle: "Mock settlement batches only",
    activeSection: "Settlements",
    body: `<section class="card"><table><thead><tr><th>ID</th><th>Status</th><th>Delay</th><th>Transactions</th></tr></thead><tbody>${rows}</tbody></table></section>`,
  });
}

export function renderSettingsPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  return renderDashboardShell({
    brand,
    title: "Settings",
    subtitle: "Presentation settings scaffold",
    activeSection: "Settings",
    body: `<section class="card"><h2>${escapeHtml(view.merchantName)}</h2><p class="muted">Financial settings are read-only in this UI scaffold. Core ledger configuration is managed outside the product layer.</p></section>`,
  });
}

function metricCard(label: string, value: string): string {
  return `<div class="card"><div class="muted">${escapeHtml(label)}</div><h2>${escapeHtml(value)}</h2></div>`;
}
