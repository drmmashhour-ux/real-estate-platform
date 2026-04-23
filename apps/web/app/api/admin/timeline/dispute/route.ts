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

  const disputeId = (new URL(request.url).searchParams.get("disputeId") ?? "").trim();
  if (!disputeId) return NextResponse.json({ error: "disputeId required" }, { status: 400 });

  const orderParam = (new URL(request.url).searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: { select: { id: true, confirmationCode: true, status: true } },
      listing: { select: { id: true, listingCode: true, title: true } },
      messages: { orderBy: { createdAt: orderDir } },
      evidence: { orderBy: { createdAt: orderDir } },
      resolutions: { orderBy: { resolvedAt: orderDir } },
    },
  });

  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

  const rows: Row[] = [];

  rows.push({
    sortAt: dispute.createdAt,
    source: "dispute",
    label: "Dispute opened",
    detail: {
      status: dispute.status,
      claimant: dispute.claimant,
      claimantUserId: dispute.claimantUserId,
      category: dispute.complaintCategory,
      bookingId: dispute.bookingId,
    },
  });

  if (dispute.updatedAt.getTime() !== dispute.createdAt.getTime()) {
    rows.push({
      sortAt: dispute.updatedAt,
      source: "dispute",
      label: "Dispute record updated",
      detail: { status: dispute.status },
    });
  }

  if (dispute.hostRespondedAt) {
    rows.push({
      sortAt: dispute.hostRespondedAt,
      source: "dispute",
      label: "Host responded",
      detail: {},
    });
  }

  for (const m of dispute.messages) {
    rows.push({
      sortAt: m.createdAt,
      source: "dispute_message",
      label: m.isInternal ? "Internal dispute note" : "Dispute message",
      detail: { senderId: m.senderId, internal: m.isInternal },
    });
  }

  for (const e of dispute.evidence) {
    rows.push({
      sortAt: e.createdAt,
      source: "dispute_evidence",
      label: "Evidence uploaded",
      detail: { evidenceId: e.id, uploadedBy: e.uploadedBy, url: e.url },
    });
  }

  for (const r of dispute.resolutions) {
    rows.push({
      sortAt: r.resolvedAt,
      source: "dispute_resolution",
      label: `Resolution: ${r.resolutionType}`,
      detail: {
        refundCents: r.refundCents,
        notes: r.notes,
        resolvedBy: r.resolvedBy,
      },
    });
  }

  if (dispute.resolvedAt) {
    rows.push({
      sortAt: dispute.resolvedAt,
      source: "dispute",
      label: "Dispute closed / resolved (record)",
      detail: {
        outcome: dispute.resolutionOutcome,
        refundCents: dispute.refundCents,
        resolvedBy: dispute.resolvedBy,
      },
    });
  }

  rows.sort((a, b) =>
    orderDir === "desc" ? b.sortAt.getTime() - a.sortAt.getTime() : a.sortAt.getTime() - b.sortAt.getTime()
  );

  return NextResponse.json({
    dispute: {
      id: dispute.id,
      status: dispute.status,
      booking: dispute.booking,
      listing: dispute.listing,
    },
    order: orderDir,
    timeline: rows.map((r) => ({ ...r, sortAt: r.sortAt.toISOString() })),
  });
}
