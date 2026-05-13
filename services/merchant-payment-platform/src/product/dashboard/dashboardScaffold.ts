import type { BrandIdentity } from "../brand/brandConfig.js";
import { renderDataTable, renderKpiCard, renderStatusBadge, statusTone } from "../ui/components.js";
import { escapeHtml, renderCurrency } from "../ui/html.js";
import { renderDashboardShell } from "../ui/layout/dashboardShell.js";
import type {
  DashboardSettlementRead,
  DashboardTransactionRead,
  MerchantDashboardReadModel,
} from "./viewModels.js";

export function renderOverviewPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  const body = `<section class="grid">
    ${renderKpiCard("Daily volume", renderCurrency(view.dailyVolumeMinor, view.currency), "Today")}
    ${renderKpiCard("Weekly volume", renderCurrency(view.weeklyVolumeMinor, view.currency), "Last 7 days")}
    ${renderKpiCard("Revenue", renderCurrency(view.revenueMinor, view.currency), "Recorded ledger volume")}
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
  const table = renderDataTable<DashboardTransactionRead>(
    [
      { header: "ID", render: (transaction) => escapeHtml(transaction.id) },
      { header: "Status", render: (transaction) => renderStatusBadge(transaction.status, statusTone(transaction.status)) },
      { header: "Provider", render: (transaction) => escapeHtml(transaction.provider) },
      { header: "Amount", render: (transaction) => renderCurrency(transaction.money.amountMinor, transaction.money.currency) },
    ],
    view.transactions,
  );
  return renderDashboardShell({
    brand,
    title: "Transactions",
    subtitle: "Read-only ledger-backed transaction history",
    activeSection: "Transactions",
    body: `<section class="card">${table}</section>`,
  });
}

export function renderSettlementsPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  const table = renderDataTable<DashboardSettlementRead>(
    [
      { header: "ID", render: (settlement) => escapeHtml(settlement.id) },
      { header: "Status", render: (settlement) => renderStatusBadge(settlement.status, statusTone(settlement.status)) },
      { header: "Delay", render: (settlement) => escapeHtml(settlement.delay) },
      { header: "Transactions", render: (settlement) => String(settlement.transactionIds.length) },
    ],
    view.settlements,
  );
  return renderDashboardShell({
    brand,
    title: "Settlements",
    subtitle: "Mock settlement batches only",
    activeSection: "Settlements",
    body: `<section class="card">${table}</section>`,
  });
}

export function renderFeesPage(view: MerchantDashboardReadModel, brand: BrandIdentity): string {
  return renderDashboardShell({
    brand,
    title: "Fees",
    subtitle: "Read-only platform fee breakdown",
    activeSection: "Fees",
    body: `<section class="grid">
      ${renderKpiCard("Fee balance", renderCurrency(view.feeBalanceMinor, view.currency), "Ledger-derived")}
      ${renderKpiCard("Fee rate", `${view.platformFeeBps} bps`, "Merchant configuration")}
      ${renderKpiCard("Recorded revenue", renderCurrency(view.revenueMinor, view.currency), "Before fee deduction")}
    </section>`,
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
