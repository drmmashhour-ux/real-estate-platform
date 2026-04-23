import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PrivacyPurpose } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 });

  try {
    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    // 1. Check for signed acknowledgement (TRANSACTION_EXECUTION)
    const acknowledgement = await prisma.privacyConsentRecord.findFirst({
      where: {
        transactionId,
        purpose: PrivacyPurpose.TRANSACTION_EXECUTION,
        granted: true,
        revokedAt: null,
      },
      orderBy: { grantedAt: "desc" },
    });

    // 2. Get recent disclosures
    const disclosures = await prisma.privacyAuditLog.findMany({
      where: {
        entityType: "Transaction",
        entityId: transactionId,
        action: "EXTERNAL_DISCLOSURE",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 3. Get recent access logs
    const accessLogs = await prisma.privacyAuditLog.findMany({
      where: {
        entityType: "Transaction",
        entityId: transactionId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      acknowledgement: acknowledgement ? {
        signedAt: acknowledgement.grantedAt,
        metadata: { role: tx.buyerId === acknowledgement.userId ? "BUYER" : "SELLER" },
      } : null,
      disclosures: disclosures.map(d => ({
        recipientName: (d.metadata as any)?.recipientName,
        createdAt: d.createdAt,
      })),
      accessLogs: accessLogs.map(l => ({
        action: l.action,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
