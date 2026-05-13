import type { BrandConfiguration } from "../brand/brandConfig.js";

export interface PosUiState {
  merchantId: string;
  availableProviders: readonly string[];
  lastTransactionStatus?: string;
  lastReceiptId?: string;
}

export function renderPosHtml(state: PosUiState, brand: BrandConfiguration): string {
  const providerOptions = state.availableProviders
    .map((provider) => `<option value="${escapeHtml(provider)}">${escapeHtml(provider)}</option>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(brand.brandName)} POS</title>
  <style>
    body { margin: 0; font-family: ${brand.theme.tokens.typography.fontFamily}; background: ${brand.theme.tokens.colors.background}; color: ${brand.theme.tokens.colors.text}; }
    main { max-width: 720px; margin: 0 auto; padding: ${brand.theme.tokens.spacing.xl}; }
    form, .card { background: ${brand.theme.tokens.colors.surface}; border-radius: ${brand.theme.borderRadius}; padding: ${brand.theme.tokens.spacing.lg}; margin-bottom: ${brand.theme.tokens.spacing.lg}; }
    label { display: block; margin-top: ${brand.theme.tokens.spacing.md}; color: ${brand.theme.tokens.colors.mutedText}; }
    input, select, button { width: 100%; padding: ${brand.theme.tokens.spacing.md}; margin-top: ${brand.theme.tokens.spacing.xs}; }
    button { background: ${brand.theme.tokens.colors.primary}; color: white; border: 0; border-radius: ${brand.theme.borderRadius}; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.brandName)} logo" height="32" />
      <h1>Point of Sale</h1>
      <p>Digital receipts only. All payment status is mock-only and ledger-backed.</p>
    </section>
    <form method="post" action="/api/pos/transactions">
      <input type="hidden" name="merchantId" value="${escapeHtml(state.merchantId)}" />
      <label>Provider</label>
      <select name="provider">${providerOptions}</select>
      <label>Amount in minor units</label>
      <input name="amountMinor" inputmode="numeric" required />
      <label>Currency</label>
      <input name="currency" value="${escapeHtml(brand.currencyDisplay.currency)}" required />
      <label>Idempotency key</label>
      <input name="idempotencyKey" required />
      <button type="submit">Create transaction</button>
    </form>
    <section class="card">
      <h2>Status</h2>
      <p>Last transaction: ${escapeHtml(state.lastTransactionStatus ?? "none")}</p>
      <p>Last receipt: ${escapeHtml(state.lastReceiptId ?? "none")}</p>
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
