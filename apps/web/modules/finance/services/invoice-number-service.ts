import { prisma } from "@/lib/db";

/** Pattern: INV-YYYY-000001 (per tenant, per calendar year). */
export async function nextTenantInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await prisma.tenantInvoice.findFirst({
    where: { tenantId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let seq = 1;
  if (last?.invoiceNumber) {
    const part = last.invoiceNumber.slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(6, "0")}`;
}
