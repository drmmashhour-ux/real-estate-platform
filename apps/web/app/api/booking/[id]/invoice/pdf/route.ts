import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getGuestId } from "@/lib/auth/session";
import {
  assertBookingInvoiceAccess,
  bookingToInvoiceJson,
  redactBnhubInvoiceForGuest,
} from "@/lib/bnhub/booking-invoice";
import { prisma } from "@repo/db";
import { BnhubInvoicePdfDocument } from "@/lib/pdf/bnhub-invoice-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/booking/[id]/invoice/pdf — Download invoice as PDF.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;
  const userId = await getGuestId();
  const gate = await assertBookingInvoiceAccess(bookingId, userId);
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }
  if (gate.booking.payment?.status !== "COMPLETED") {
    return Response.json(
      { error: "Invoice PDF is available after payment completes." },
      { status: 409 }
    );
  }

  const raw = bookingToInvoiceJson(gate.booking);
  const viewerId = userId!;
  const dbUser = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  const isAdmin = dbUser?.role === "ADMIN";
  const isHost = gate.booking.listing.ownerId === viewerId;
  const isGuest = gate.booking.guestId === viewerId;
  const showSettlement = isAdmin || isHost;
  const data = isGuest && !showSettlement ? redactBnhubInvoiceForGuest(raw) : raw;
  const safeCode = (data.confirmationCode ?? "booking").replace(/[^a-zA-Z0-9-_]/g, "_");

  try {
    const buffer = await renderToBuffer(
      // react-pdf expects `ReactElement<Document>`; our FC root is `<Document>`.
      React.createElement(BnhubInvoicePdfDocument, { data }) as Parameters<typeof renderToBuffer>[0]
    );
    const filename = `bnhub-invoice-${safeCode}.pdf`;
    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[invoice/pdf]", e);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
