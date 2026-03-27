import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateDisputeCode } from "@/lib/codes/generate-code";
import { createNotification } from "@/modules/notifications/services/create-notification";

export const dynamic = "force-dynamic";

/** Authenticated users open a cross-cutting legal/financial dispute (non-BNHub-only). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: {
    type?: unknown;
    description?: unknown;
    bookingId?: unknown;
    listingId?: unknown;
    fsboListingId?: unknown;
    dealId?: unknown;
    leadId?: unknown;
    platformPaymentId?: unknown;
    platformInvoiceId?: unknown;
    targetUserId?: unknown;
    evidenceUrls?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!type || !description) {
    return NextResponse.json({ error: "type and description required" }, { status: 400 });
  }

  const row = await prisma.$transaction(async (tx) => {
    const disputeCode = await generateDisputeCode(tx);
    return tx.platformLegalDispute.create({
      data: {
        disputeCode,
        type,
        description,
        openedByUserId: userId,
        bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
        listingId: typeof body.listingId === "string" ? body.listingId : undefined,
        fsboListingId: typeof body.fsboListingId === "string" ? body.fsboListingId : undefined,
        dealId: typeof body.dealId === "string" ? body.dealId : undefined,
        leadId: typeof body.leadId === "string" ? body.leadId : undefined,
        platformPaymentId: typeof body.platformPaymentId === "string" ? body.platformPaymentId : undefined,
        platformInvoiceId: typeof body.platformInvoiceId === "string" ? body.platformInvoiceId : undefined,
        targetUserId: typeof body.targetUserId === "string" ? body.targetUserId : undefined,
        evidenceUrls: Array.isArray(body.evidenceUrls) ? (body.evidenceUrls as unknown as object) : undefined,
        status: "OPEN",
      },
    });
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
    take: 50,
  });
  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "SYSTEM",
        title: "New platform dispute",
        message: `${type}: ${description.slice(0, 140)}`,
        priority: "HIGH",
        actionUrl: `/admin/legal-finance`,
      })
    )
  );

  return NextResponse.json({ ok: true, id: row.id });
}
