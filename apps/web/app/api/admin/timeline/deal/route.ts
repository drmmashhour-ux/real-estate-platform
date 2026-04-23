import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Row = { sortAt: Date; source: string; label: string; detail: Record<string, unknown> };

/**
 * Admin: deal lifecycle — milestones, documents, contracts, platform payments, commissions, CRM notes.
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dealId = (new URL(request.url).searchParams.get("dealId") ?? "").trim();
  if (!dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  const orderParam = (new URL(request.url).searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      milestones: { orderBy: { createdAt: orderDir } },
      documents: { orderBy: { createdAt: orderDir } },
      contracts: { orderBy: { createdAt: orderDir } },
      payments: { orderBy: { createdAt: orderDir } },
      crmInteractions: { orderBy: { createdAt: orderDir }, take: 100 },
      lead: { select: { id: true, email: true, contactOrigin: true, createdAt: true } },
    },
  });

  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const commissions = await prisma.platformCommissionRecord.findMany({
    where: { dealId },
    orderBy: { createdAt: orderDir },
    take: 50,
  });

  const rows: Row[] = [];

  rows.push({
    sortAt: deal.createdAt,
    source: "deal",
    label: `Deal opened (${deal.status})`,
    detail: {
      listingCode: deal.listingCode,
      priceCents: deal.priceCents,
      leadContactOrigin: deal.leadContactOrigin,
      commissionEligible: deal.commissionEligible,
    },
  });

  if (deal.updatedAt.getTime() !== deal.createdAt.getTime()) {
    rows.push({
      sortAt: deal.updatedAt,
      source: "deal",
      label: "Deal record updated",
      detail: { status: deal.status, crmStage: deal.crmStage },
    });
  }

  if (deal.lead) {
    rows.push({
      sortAt: deal.lead.createdAt,
      source: "lead",
      label: `Originating lead (${deal.lead.contactOrigin ?? "—"})`,
      detail: { leadId: deal.lead.id, email: deal.lead.email },
    });
  }

  for (const m of deal.milestones) {
    rows.push({
      sortAt: m.completedAt ?? m.createdAt,
      source: "deal_milestone",
      label: `Milestone: ${m.name} (${m.status})`,
      detail: { milestoneId: m.id, dueDate: m.dueDate?.toISOString() ?? null },
    });
  }

  for (const d of deal.documents) {
    rows.push({
      sortAt: d.createdAt,
      source: "deal_document",
      label: `Document: ${d.type}`,
      detail: { documentId: d.id, status: d.status },
    });
  }

  for (const c of deal.contracts) {
    rows.push({
      sortAt: c.createdAt,
      source: "contract",
      label: `Contract ${c.type} (${c.status})`,
      detail: { contractId: c.id, signed: c.signed },
    });
    if (c.signedAt) {
      rows.push({
        sortAt: c.signedAt,
        source: "contract",
        label: "Contract signed",
        detail: { contractId: c.id },
      });
    }
  }

  for (const p of deal.payments) {
    rows.push({
      sortAt: p.createdAt,
      source: "platform_payment",
      label: `Platform payment (${p.paymentType})`,
      detail: {
        paymentId: p.id,
        amountCents: p.amountCents,
        status: p.status,
        linkedContractId: p.linkedContractId,
      },
    });
  }

  for (const com of commissions) {
    rows.push({
      sortAt: com.createdAt,
      source: "platform_commission",
      label: "Commission record",
      detail: {
        id: com.id,
        commissionSource: com.commissionSource,
        amountCents: com.commissionAmountCents,
        eligible: com.commissionEligible,
      },
    });
  }

  for (const x of deal.crmInteractions) {
    rows.push({
      sortAt: x.createdAt,
      source: "crm_interaction",
      label: `CRM: ${x.type}`,
      detail: { id: x.id, brokerId: x.brokerId },
    });
  }

  rows.sort((a, b) =>
    orderDir === "desc" ? b.sortAt.getTime() - a.sortAt.getTime() : a.sortAt.getTime() - b.sortAt.getTime()
  );

  return NextResponse.json({
    deal: {
      id: deal.id,
      status: deal.status,
      listingCode: deal.listingCode,
      buyerId: deal.buyerId,
      sellerId: deal.sellerId,
      brokerId: deal.brokerId,
    },
    order: orderDir,
    timeline: rows.map((r) => ({ ...r, sortAt: r.sortAt.toISOString() })),
  });
}
