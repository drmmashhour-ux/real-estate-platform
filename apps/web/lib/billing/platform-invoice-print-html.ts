/**
 * Printable invoice HTML from persisted `PlatformInvoice` + `invoiceTaxDetails` JSON.
 * Safe to import from client components — contains no secrets; data comes from the API response.
 */

export type PlatformInvoicePrintInput = {
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  invoiceLabel?: string | null;
  invoiceIssuer?: string | null;
  payment: { paymentType: string };
  subtotalCents?: number | null;
  gstCents?: number | null;
  qstCents?: number | null;
  totalCents?: number | null;
  taxMode?: string | null;
  invoiceLines?: unknown;
  invoiceTaxDetails?: {
    broker?: {
      legalName: string;
      gstNumber: string | null;
      qstNumber: string | null;
      businessNumberNine: string;
      reviewStatus: string;
    };
    platform?: {
      legalName?: string | null;
      gstNumber?: string | null;
      qstNumber?: string | null;
      note?: string | null;
      taxBreakdown?: {
        currency: string;
        taxMode: string;
        gstRatePercent: number;
        qstRatePercent: number;
        combinedSubtotalCents: number;
        combinedGstCents: number;
        combinedQstCents: number;
        chargedTotalCents: number;
        lines: Array<{
          party: string;
          description: string;
          subtotalCents: number;
          gstCents: number;
          qstCents: number;
          lineTotalCents: number;
          taxApplied: boolean;
        }>;
      } | null;
    };
    disclaimer?: string;
  } | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

type LineRow = {
  party: string;
  description: string;
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  lineTotalCents: number;
  taxApplied?: boolean;
};

function parseLines(raw: unknown): LineRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is LineRow => Boolean(x) && typeof x === "object" && "lineTotalCents" in x);
}

export function buildPlatformInvoiceDocumentHtml(inv: PlatformInvoicePrintInput): string {
  const cur = inv.currency || "CAD";
  const p = inv.invoiceTaxDetails?.platform;
  const bd = p?.taxBreakdown;
  const fromStored = parseLines(inv.invoiceLines);
  const lines: LineRow[] = bd?.lines?.length ? bd.lines : fromStored;

  const sub =
    bd?.combinedSubtotalCents ??
    inv.subtotalCents ??
    (lines.length ? lines.reduce((s, l) => s + l.subtotalCents, 0) : null);
  const gst = bd?.combinedGstCents ?? inv.gstCents ?? null;
  const qst = bd?.combinedQstCents ?? inv.qstCents ?? null;
  const total =
    bd?.chargedTotalCents ?? inv.totalCents ?? inv.amountCents;

  const legal = p?.legalName?.trim() || "Platform";
  const gstNo = p?.gstNumber?.trim() || "—";
  const qstNo = p?.qstNumber?.trim() || "—";

  let rowsHtml = "";
  if (lines.length > 0) {
    for (const l of lines) {
      const taxNote = l.taxApplied ? "" : " <span class=\"muted\">(no tax)</span>";
      rowsHtml += `<tr>
        <td>${escapeHtml(l.description)}${taxNote}<br/><span class="muted small">${escapeHtml(l.party)}</span></td>
        <td class="num">${money(l.subtotalCents, bd?.currency ?? cur)}</td>
        <td class="num">${money(l.gstCents, bd?.currency ?? cur)}</td>
        <td class="num">${money(l.qstCents, bd?.currency ?? cur)}</td>
        <td class="num"><strong>${money(l.lineTotalCents, bd?.currency ?? cur)}</strong></td>
      </tr>`;
    }
  } else {
    rowsHtml = `<tr>
      <td>${escapeHtml(inv.payment.paymentType)} — platform services / settlement</td>
      <td class="num">${sub != null ? money(sub, cur) : "—"}</td>
      <td class="num">${gst != null ? money(gst, cur) : "—"}</td>
      <td class="num">${qst != null ? money(qst, cur) : "—"}</td>
      <td class="num"><strong>${money(total, cur)}</strong></td>
    </tr>`;
  }

  const brokerBlock =
    inv.invoiceTaxDetails?.broker ?
      `<section class="box">
        <h2>Related broker (on file)</h2>
        <p class="small">${escapeHtml(inv.invoiceTaxDetails.broker.legalName)}<br/>
        GST: ${escapeHtml(inv.invoiceTaxDetails.broker.gstNumber ?? "—")}<br/>
        QST: ${escapeHtml(inv.invoiceTaxDetails.broker.qstNumber ?? "—")}<br/>
        BN: ${escapeHtml(inv.invoiceTaxDetails.broker.businessNumberNine)}<br/>
        Internal review: ${escapeHtml(inv.invoiceTaxDetails.broker.reviewStatus)}</p>
      </section>`
    : "";

  const ratesLine =
    bd ?
      `<p class="small muted">Tax mode: ${escapeHtml(bd.taxMode)} · Rates: GST ${bd.gstRatePercent}% + QST ${bd.qstRatePercent}% (Quebec formula on platform configuration).</p>`
    : inv.taxMode ?
      `<p class="small muted">Tax mode: ${escapeHtml(inv.taxMode)}</p>`
    : "";

  const disc = inv.invoiceTaxDetails?.disclaimer ? `<p class="fine">${escapeHtml(inv.invoiceTaxDetails.disclaimer)}</p>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${escapeHtml(inv.invoiceNumber)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; color: #111; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .sub { color: #555; font-size: 13px; margin-bottom: 24px; }
    .issuer { margin-bottom: 20px; line-height: 1.5; }
    .issuer strong { display: block; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; vertical-align: top; }
    th { background: #f5f5f5; text-align: left; }
    td.num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 12px; font-size: 14px; }
    .totals tr td { border: none; padding: 4px 0; }
    .totals .label { text-align: right; padding-right: 16px; color: #444; }
    .muted { color: #666; }
    .small { font-size: 12px; }
    .fine { font-size: 11px; color: #666; margin-top: 24px; max-width: 640px; }
    .box { margin-top: 20px; padding: 12px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; }
    .box h2 { font-size: 13px; margin: 0 0 8px 0; }
  </style></head><body>
    <h1>${escapeHtml(inv.invoiceLabel?.trim() || "Invoice")}</h1>
    <p class="sub">Invoice #${escapeHtml(inv.invoiceNumber)} · ${inv.invoiceIssuer ? escapeHtml(String(inv.invoiceIssuer)) + " · " : ""}${escapeHtml(new Date(inv.createdAt).toLocaleDateString())}</p>
    <div class="issuer">
      <strong>${escapeHtml(legal)}</strong>
      <span>GST/HST registration: ${escapeHtml(gstNo)}</span><br/>
      <span>QST registration: ${escapeHtml(qstNo)}</span>
      ${p?.note ? `<p class="small muted" style="margin-top:8px">${escapeHtml(p.note)}</p>` : ""}
    </div>
    ${ratesLine}
    <table>
      <thead><tr><th>Description</th><th class="num">Subtotal</th><th class="num">GST</th><th class="num">QST</th><th class="num">Line total</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <table class="totals" style="margin-left:auto;width:auto">
      ${sub != null ? `<tr><td class="label">Combined subtotal</td><td class="num">${money(sub, cur)}</td></tr>` : ""}
      ${gst != null ? `<tr><td class="label">GST</td><td class="num">${money(gst, cur)}</td></tr>` : ""}
      ${qst != null ? `<tr><td class="label">QST</td><td class="num">${money(qst, cur)}</td></tr>` : ""}
      <tr><td class="label"><strong>Total charged (payment)</strong></td><td class="num"><strong>${money(total, cur)}</strong></td></tr>
    </table>
    ${brokerBlock}
    ${disc}
  </body></html>`;
}
