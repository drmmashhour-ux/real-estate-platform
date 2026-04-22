import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[transaction.form-context]";

/** Mandatory visible line for every generated artifact (PDF/HTML/metadata). */
export const SD_TRANSACTION_LINE_PREFIX = "Transaction No:";

export type SdFormContext = {
  transactionId: string;
  transactionNumber: string;
  transactionType: string;
  status: string;
  title: string | null;
  openedAtIso: string;
  broker: { id: string; name: string | null; email: string | null };
  listing: { id: string; title: string; listingCode: string } | null;
  property: { id: string; address: string; city: string } | null;
  parties: Array<{ role: string; displayName: string; email: string | null }>;
};

export function buildMandatoryTransactionLine(transactionNumber: string): string {
  return `${SD_TRANSACTION_LINE_PREFIX} ${transactionNumber}`;
}

export function assertTransactionNumberInPayload(text: string, transactionNumber: string): void {
  const needle = buildMandatoryTransactionLine(transactionNumber);
  if (!text.includes(transactionNumber)) {
    throw new Error("Generated document rejected: transactionNumber missing from payload");
  }
  if (!text.includes(SD_TRANSACTION_LINE_PREFIX)) {
    throw new Error(`Generated document rejected: must contain "${SD_TRANSACTION_LINE_PREFIX}"`);
  }
}

/** Load full context for generation / compliance (never omit SD number). */
export async function buildSdFormContext(transactionId: string): Promise<SdFormContext> {
  const tx = await prisma.lecipmSdTransaction.findUnique({
    where: { id: transactionId },
    include: {
      broker: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, listingCode: true } },
      property: { select: { id: true, address: true, city: true } },
      parties: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!tx) throw new Error("Transaction not found");
  if (!tx.transactionNumber?.trim()) throw new Error("transactionNumber missing — cannot generate documents");

  logInfo(`${TAG}`, { transactionId, transactionNumber: tx.transactionNumber });

  return {
    transactionId: tx.id,
    transactionNumber: tx.transactionNumber,
    transactionType: tx.transactionType,
    status: tx.status,
    title: tx.title,
    openedAtIso: tx.openedAt.toISOString(),
    broker: tx.broker,
    listing: tx.listing,
    property: tx.property,
    parties: tx.parties.map((p) => ({
      role: p.role,
      displayName: p.displayName,
      email: p.email,
    })),
  };
}

export function renderGeneratedDocumentHtml(ctx: SdFormContext, templateCode: string, extraBody: string): string {
  const header = `
<div class="sd-doc-header" style="border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:16px;">
  <p style="font-weight:bold;margin:0;">${escapeHtml(buildMandatoryTransactionLine(ctx.transactionNumber))}</p>
  <p style="margin:4px 0 0;font-size:12px;color:#444;">Template: ${escapeHtml(templateCode)} · ${escapeHtml(ctx.transactionType)}</p>
</div>`;

  const partiesBlock =
    ctx.parties.length ?
      `<section><h3>Parties</h3><ul>${ctx.parties.map((p) => `<li>${escapeHtml(p.role)}: ${escapeHtml(p.displayName)}</li>`).join("")}</ul></section>`
    : "";

  const propertyBlock =
    ctx.property ?
      `<section><h3>Property</h3><p>${escapeHtml(ctx.property.address)}, ${escapeHtml(ctx.property.city)}</p></section>`
    : ctx.listing ?
      `<section><h3>Listing</h3><p>${escapeHtml(ctx.listing.listingCode)} — ${escapeHtml(ctx.listing.title)}</p></section>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(ctx.title ?? "Document")}</title></head><body>
${header}
${propertyBlock}
${partiesBlock}
<section>${extraBody}</section>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
