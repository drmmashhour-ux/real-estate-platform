import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Row = { sortAt: Date; source: string; label: string; detail: Record<string, unknown> };

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contractId = (new URL(request.url).searchParams.get("contractId") ?? "").trim();
  if (!contractId) return NextResponse.json({ error: "contractId required" }, { status: 400 });

  const orderParam = (new URL(request.url).searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      legalAuditLogs: { orderBy: { createdAt: orderDir } },
      signatures: { orderBy: { createdAt: "asc" } },
      paymentLegalLinks: { take: 5 },
      platformPaymentLegalLinks: { take: 5 },
    },
  });

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  const rows: Row[] = [];

  rows.push({
    sortAt: contract.createdAt,
    source: "contract",
    label: `Contract created (${contract.type})`,
    detail: {
      status: contract.status,
      hub: contract.hub,
      bookingId: contract.bookingId,
      dealId: contract.dealId,
      fsboListingId: contract.fsboListingId,
    },
  });

  if (contract.updatedAt.getTime() !== contract.createdAt.getTime()) {
    rows.push({
      sortAt: contract.updatedAt,
      source: "contract",
      label: "Contract record updated",
      detail: { status: contract.status },
    });
  }

  if (contract.signed && contract.signedAt) {
    rows.push({
      sortAt: contract.signedAt,
      source: "contract",
      label: "Contract signed (primary)",
      detail: { signerIp: contract.signerIpAddress, version: contract.version },
    });
  }

  for (const s of contract.signatures) {
    rows.push({
      sortAt: s.signedAt ?? s.createdAt,
      source: "contract_signature",
      label: `Signature: ${s.role}`,
      detail: { signatureId: s.id, userId: s.userId, email: s.email },
    });
  }

  for (const log of contract.legalAuditLogs) {
    rows.push({
      sortAt: log.createdAt,
      source: "legal_contract_audit",
      label: `Legal audit: ${log.action}`,
      detail: { userId: log.userId, ipAddress: log.ipAddress, version: log.version, metadata: log.metadata },
    });
  }

  for (const p of contract.paymentLegalLinks) {
    rows.push({
      sortAt: p.updatedAt,
      source: "payment_link",
      label: `Linked BNHUB payment (${p.status})`,
      detail: { paymentId: p.id, bookingId: p.bookingId },
    });
  }

  for (const p of contract.platformPaymentLegalLinks) {
    rows.push({
      sortAt: p.createdAt,
      source: "platform_payment_link",
      label: `Linked platform payment (${p.paymentType})`,
      detail: { paymentId: p.id, amountCents: p.amountCents, status: p.status },
    });
  }

  rows.sort((a, b) =>
    orderDir === "desc" ? b.sortAt.getTime() - a.sortAt.getTime() : a.sortAt.getTime() - b.sortAt.getTime()
  );

  return NextResponse.json({
    contract: {
      id: contract.id,
      type: contract.type,
      status: contract.status,
      signed: contract.signed,
      hub: contract.hub,
    },
    order: orderDir,
    timeline: rows.map((r) => ({ ...r, sortAt: r.sortAt.toISOString() })),
  });
}
