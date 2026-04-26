import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PlatformInvoiceStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PlatformInvoicePdfDocument } from "@/lib/pdf/platform-invoice-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/invoices/[id]/download — PDF for a platform invoice (payer, broker recipient, or admin).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const inv = await prisma.platformInvoice.findUnique({
    where: { id },
    include: {
      payment: {
        select: {
          userId: true,
          paymentType: true,
        },
      },
    },
  });
  if (!inv) return Response.json({ error: "Invoice not found" }, { status: 404 });

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  const isAdmin = viewer?.role === "ADMIN";
  const isParty = inv.userId === userId || inv.payment?.userId === userId;
  if (!isAdmin && !isParty) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const payer = await prisma.user.findUnique({
    where: { id: inv.userId },
    select: { email: true },
  });

  const data = {
    invoiceNumber: inv.invoiceNumber,
    issuedAt: inv.issuedAt.toISOString().slice(0, 10),
    status: inv.status === PlatformInvoiceStatus.PAID ? "PAID" : String(inv.status),
    currency: inv.currency,
    invoiceLabel: inv.invoiceLabel,
    payerEmail: payer?.email ?? null,
    subtotalCents: inv.subtotalCents,
    gstCents: inv.gstCents,
    qstCents: inv.qstCents,
    totalCents: inv.totalCents ?? inv.amountCents,
    hubSource: inv.hubSource ?? inv.payment?.paymentType ?? null,
  };

  try {
    const buffer = await renderToBuffer(
      React.createElement(PlatformInvoicePdfDocument, { data }) as Parameters<typeof renderToBuffer>[0]
    );
    const safe = inv.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${safe}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[invoices/download]", e);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
