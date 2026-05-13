import type { BrandIdentity } from "../brand/brandConfig.js";
import { renderCard, renderStatusBadge, statusTone } from "../ui/components.js";
import { escapeHtml, renderCurrency } from "../ui/html.js";

export interface ReceiptViewModel {
  merchantName: string;
  amountMinor: number;
  currency: string;
  timestamp: Date;
  transactionId: string;
  status: string;
}

export function renderReceiptCard(receipt: ReceiptViewModel, _brand: BrandIdentity): string {
  return renderCard(`<h2>Digital receipt</h2>
    <dl>
      <dt>Merchant</dt><dd>${escapeHtml(receipt.merchantName)}</dd>
      <dt>Amount</dt><dd>${renderCurrency(receipt.amountMinor, receipt.currency)}</dd>
      <dt>Timestamp</dt><dd>${escapeHtml(receipt.timestamp.toISOString())}</dd>
      <dt>Transaction ID</dt><dd>${escapeHtml(receipt.transactionId)}</dd>
      <dt>Status</dt><dd>${renderStatusBadge(receipt.status, statusTone(receipt.status))}</dd>
    </dl>`);
}
