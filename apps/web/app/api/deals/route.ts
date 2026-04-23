import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@repo/db";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { requireActiveResidentialBrokerLicence } from "@/lib/compliance/oaciq/broker-licence-guard";
import { createDealFromTransaction, createStandaloneDeal, listPipelineDeals } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or admin required" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const scopeBrokerId = auth.role === "ADMIN" ? sp.get("brokerId") ?? undefined : auth.userId;

  try {
    const deals = await listPipelineDeals({
      scopeBrokerId,
      stage: sp.get("stage"),
      decisionStatus: sp.get("decision"),
      priority: sp.get("priority"),
      dealNumberPrefix: sp.get("dealNumber") ?? undefined,
      transactionNumber: sp.get("transactionNumber") ?? undefined,
    });
    return NextResponse.json({ deals });
  } catch (e) {
    logError("[api.deals.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or admin required" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = typeof body.mode === "string" ? body.mode : "standalone";

  try {
    if (mode === "from_transaction") {
      const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
      if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 });
      const tx = await prisma.lecipmSdTransaction.findUnique({
        where: { id: transactionId },
        select: { brokerId: true, transactionType: true },
      });
      if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      if (auth.role !== "ADMIN" && tx.brokerId !== auth.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const licenceBlock = await requireActiveResidentialBrokerLicence(tx.brokerId, {
        transactionType: tx.transactionType,
        actorBrokerId: auth.userId,
        assignedBrokerId: tx.brokerId,
      });
      if (licenceBlock) return licenceBlock;
      const deal = await createDealFromTransaction({
        transactionId,
        brokerId: tx.brokerId,
        actorUserId: auth.userId,
        title: typeof body.title === "string" ? body.title : undefined,
        dealType: typeof body.dealType === "string" ? body.dealType : undefined,
      });
      return NextResponse.json({ deal });
    }

    const brokerId =
      auth.role === "ADMIN" && typeof body.brokerId === "string" ? body.brokerId : auth.userId;

    const title = typeof body.title === "string" ? body.title : "";
    const dealType = typeof body.dealType === "string" ? body.dealType : "OTHER";
    if (!title.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

    const licenceBlock = await requireActiveResidentialBrokerLicence(brokerId, {
      dealType,
      actorBrokerId: auth.userId,
      assignedBrokerId: brokerId,
    });
    if (licenceBlock) return licenceBlock;

    const deal = await createStandaloneDeal({
      brokerId,
      title,
      dealType,
      listingId: typeof body.listingId === "string" ? body.listingId : null,
      priority: typeof body.priority === "string" ? body.priority : null,
      actorUserId: auth.userId,
      ownerUserId: auth.userId,
    });

    return NextResponse.json({ deal });
  } catch (e) {
    logError("[api.deals.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
