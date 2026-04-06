function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function asText(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

export function asDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function asMoney(cents: number | null | undefined, currency = "CAD"): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function renderKeyValueRows(rows: Array<{ label: string; value: string }>): string {
  return rows
    .map(
      (row) => `<div class="kv-row"><span class="kv-label">${escapeHtml(row.label)}</span><span class="kv-value">${escapeHtml(row.value)}</span></div>`
    )
    .join("");
}

export function renderBulletList(items: string[]): string {
  if (items.length === 0) {
    return `<p class="muted">No items.</p>`;
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function buildBrandedDocumentHtml(input: {
  title: string;
  subtitle?: string;
  badge?: string;
  sections: Array<{ title: string; bodyHtml: string }>;
  footerNote?: string;
}): string {
  const subtitle = input.subtitle ? `<p class="sub">${escapeHtml(input.subtitle)}</p>` : "";
  const badge = input.badge ? `<p class="badge">${escapeHtml(input.badge)}</p>` : "";
  const sections = input.sections
    .map(
      (section) => `<section class="card"><h2>${escapeHtml(section.title)}</h2><div class="content">${section.bodyHtml}</div></section>`
    )
    .join("");
  const footer = input.footerNote ? `<p class="footer">${escapeHtml(input.footerNote)}</p>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; background: #f8fafc; }
    .page { max-width: 920px; margin: 0 auto; padding: 32px 24px 56px; }
    .hero { background: linear-gradient(135deg, #0f172a, #111827); color: white; border-radius: 18px; padding: 24px; }
    .brand { color: #d4af37; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
    h1 { margin: 10px 0 6px; font-size: 30px; line-height: 1.15; }
    .sub { margin: 0; color: #cbd5e1; font-size: 14px; }
    .badge { display: inline-block; margin-top: 14px; padding: 6px 10px; border-radius: 999px; background: rgba(212, 175, 55, 0.16); color: #f5deb3; font-size: 12px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
    .card { margin-top: 18px; border: 1px solid #e5e7eb; border-radius: 16px; background: white; padding: 18px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); page-break-inside: avoid; }
    h2 { margin: 0 0 12px; font-size: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #374151; }
    .kv-row { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
    .kv-row:last-child { border-bottom: none; }
    .kv-label { color: #64748b; }
    .kv-value { color: #111827; font-weight: 600; text-align: right; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 0 0 6px; }
    .muted { color: #64748b; }
    .footer { margin-top: 24px; color: #64748b; font-size: 12px; }
    @media print {
      body { background: white; }
      .page { padding: 12px; }
      .hero { background: #111827 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .badge { background: rgba(212, 175, 55, 0.16) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="brand">LECIPM Export</div>
      <h1>${escapeHtml(input.title)}</h1>
      ${subtitle}
      ${badge}
    </section>
    ${sections}
    ${footer}
  </main>
</body>
</html>`;
}
