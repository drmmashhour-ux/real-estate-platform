import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { computePromotionWindowEnd } from "@/lib/bnhub/promotion-orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const take = Math.min(200, Math.max(1, Number(searchParams.get("take") || 50)));

  const orders = await prisma.bnhubPromotionOrder.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      plan: true,
      payer: { select: { id: true, email: true, name: true } },
      listing: { select: { id: true, title: true, city: true } },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const planSku = typeof body.planSku === "string" ? body.planSku.trim() : "";
  const payerUserId = typeof body.payerUserId === "string" ? body.payerUserId : "";
  const shortTermListingId =
    typeof body.shortTermListingId === "string" && body.shortTermListingId ? body.shortTermListingId : null;
  const markPaid = body.markPaid === true;

  if (!planSku || !payerUserId) {
    return NextResponse.json({ error: "planSku and payerUserId required" }, { status: 400 });
  }

  const plan = await prisma.bnhubPromotionPlan.findUnique({ where: { sku: planSku } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Unknown or inactive plan" }, { status: 400 });
  }

  const startAt = new Date();
  const endAt = computePromotionWindowEnd(startAt, plan.billingPeriod);

  const order = await prisma.bnhubPromotionOrder.create({
    data: {
      planId: plan.id,
      payerUserId,
      shortTermListingId,
      status: markPaid ? "paid" : "pending",
      startAt,
      endAt,
      amountCents: plan.priceCents,
      metadata: { createdByAdminId: adminId } as object,
    },
    include: { plan: true },
  });

  return NextResponse.json({ order });
}
