import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { requireF1Admin } from "@/lib/payment-f1-admin";
import { prisma } from "@/lib/db";
import { f1PlanStronger } from "@/lib/payment-f1";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import type { SyriaListingPlan } from "@/generated/prisma";
import { routing } from "@/i18n/routing";

export async function POST(req: Request) {
  const gate = await requireF1Admin(req);
  if (gate) return gate;

  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const requestId = typeof (body as { requestId?: unknown }).requestId === "string" ? (body as { requestId: string }).requestId.trim() : "";
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "missing_request_id" }, { status: 400 });
  }

  const days = syriaPlatformConfig.monetization.featuredDurationDays;
  const out = await prisma.$transaction(async (tx) => {
    const row = await tx.syriaPaymentRequest.findUnique({ where: { id: requestId } });
    if (!row) return { type: "not_found" as const };
    if (row.status === "confirmed") {
      return { type: "already" as const, listingId: row.listingId };
    }
    if (row.status === "rejected") {
      return { type: "rejected" as const };
    }
    if (row.status !== "pending") {
      return { type: "bad_state" as const };
    }

    const targetPlan: SyriaListingPlan = row.plan === "premium" ? "premium" : "featured";
    const listing = await tx.syriaProperty.findUnique({ where: { id: row.listingId } });
    if (!listing) {
      return { type: "listing_missing" as const };
    }
    const merged = f1PlanStronger(targetPlan, listing.plan);

    const until = new Date();
    until.setDate(until.getDate() + days);

    await tx.syriaPaymentRequest.update({
      where: { id: requestId },
      data: { status: "confirmed", confirmedAt: new Date() },
    });

    await tx.syriaProperty.update({
      where: { id: row.listingId },
      data: {
        plan: merged,
        isFeatured: true,
        featuredUntil: until,
      },
    });

    await tx.syriaListingFinance.upsert({
      where: { listingId: row.listingId },
      create: {
        listingId: row.listingId,
        totalRequests: 0,
        totalConfirmed: 1,
        lastStatus: "confirmed",
      },
      update: {
        totalConfirmed: { increment: 1 },
        lastStatus: "confirmed",
      },
    });

    return { type: "ok" as const, listingId: row.listingId };
  });

  if (out.type === "not_found") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (out.type === "rejected" || out.type === "bad_state") {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }
  if (out.type === "listing_missing") {
    return NextResponse.json({ ok: false, error: "listing_missing" }, { status: 404 });
  }
  if (out.type === "already") {
    return NextResponse.json({ ok: true, already: true, listingId: out.listingId });
  }

  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/buy`);
    revalidatePath(`/${loc}/rent`);
    revalidatePath(`/${loc}/dashboard/listings`);
    revalidatePath(`/${loc}`);
    if (out.listingId) {
      revalidatePath(`/${loc}/listing/${out.listingId}`);
    }
  }
  return NextResponse.json({ ok: true, listingId: out.listingId });
}
