import type { BrandIdentity } from "../brand/brandConfig.js";
import { renderButton, renderCard, renderStatusBadge, statusTone } from "../ui/components.js";
import { escapeHtml, renderCurrency } from "../ui/html.js";
import { renderReceiptCard, type ReceiptViewModel } from "../receipt/receiptScaffold.js";

export interface PosProduct {
  id: string;
  name: string;
  amountMinor: number;
  currency: string;
}

export interface PosScaffoldState {
  merchantId: string;
  products: readonly PosProduct[];
  amountInputMinor?: number;
  checkoutStatus: "idle" | "pending" | "success";
  receiptId?: string;
  receipt?: ReceiptViewModel;
}

export const mockPosProducts: readonly PosProduct[] = Object.freeze([
  { id: "sku_terminal_001", name: "Terminal test item", amountMinor: 2500, currency: "USD" },
  { id: "sku_service_001", name: "Service fee sample", amountMinor: 5000, currency: "USD" },
  { id: "sku_invoice_001", name: "Invoice sample", amountMinor: 12500, currency: "USD" },
]);

export function renderPosScaffold(state: PosScaffoldState, brand: BrandIdentity): string {
  const tokens = brand.tokens;
  const productList = state.products
    .map(
      (product) =>
        `<li><span>${escapeHtml(product.name)}</span><strong>${renderCurrency(product.amountMinor, product.currency)}</strong></li>`,
    )
    .join("");
  const total = state.products.reduce((sum, product) => sum + product.amountMinor, 0);
  const currency = state.products[0]?.currency ?? "USD";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(brand.brandName)} POS</title>
  <style>
    body { margin: 0; background: ${tokens.colors.background}; color: ${tokens.colors.text}; font-family: ${tokens.typography.fontFamily}; }
    main { max-width: 960px; margin: 0 auto; padding: ${tokens.spacing.xl}; }
    .header, .panel { background: ${tokens.colors.surface}; border: 1px solid ${tokens.colors.border}; border-radius: ${tokens.radii.lg}; padding: ${tokens.spacing.lg}; margin-bottom: ${tokens.spacing.md}; }
    .grid { display: grid; grid-template-columns: 1fr 360px; gap: ${tokens.spacing.md}; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; justify-content: space-between; padding: ${tokens.spacing.md} 0; border-bottom: 1px solid ${tokens.colors.border}; }
    button { background: ${tokens.colors.primary}; color: white; border: 0; border-radius: ${tokens.radii.md}; padding: ${tokens.spacing.md}; width: 100%; }
    .muted { color: ${tokens.colors.textMuted}; }
  </style>
</head>
<body>
  <main>
    <section class="header"><h1>${escapeHtml(brand.brandName)} POS</h1><p class="muted">Presentation scaffold only. Checkout requests must go through the API layer; no payment execution occurs here.</p></section>
    <section class="grid">
      <div class="panel"><h2>Products</h2><ul>${productList}</ul></div>
      <div class="panel">
        <h2>Checkout</h2>
        <p class="muted">Merchant: ${escapeHtml(state.merchantId)}</p>
        <label>Amount</label>
        <input value="${renderCurrency(state.amountInputMinor ?? total, currency)}" readonly />
        <p>Status: ${renderStatusBadge(state.checkoutStatus, statusTone(state.checkoutStatus))}</p>
        ${renderButton("Create transaction request", tokens)}
      </div>
    </section>
    ${state.receipt ? renderReceiptCard(state.receipt, brand) : renderCard(`<h2>Digital receipt</h2><p>Receipt: ${escapeHtml(state.receiptId ?? "not generated")}</p>`)}
  </main>
</body>
</html>`;
}
