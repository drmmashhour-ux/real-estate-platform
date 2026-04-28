import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMonetizationAdminContact } from "@/lib/monetization-contact";
import { f1ViewTierAndPrices } from "@/config/syria-f1-pricing.config";
import {
  f1BuildWhatsAppPaymentText,
  f1BuildWhatsAppPaymentTextEn,
  f1BuildWhatsAppUrl,
  f1CanRequestPlan,
  type F1PlanKey,
} from "@/lib/payment-f1";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
function parseBody(body: unknown): { listingId: string; plan: F1PlanKey } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const listingId = typeof o.listingId === "string" ? o.listingId.trim() : "";
  const plan = typeof o.plan === "string" ? o.plan.trim() : "";
  if (!listingId) return null;
  if (plan !== "featured" && plan !== "premium") return null;
  return { listingId, plan };
}

export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { listingId, plan: targetPlan } = parsed;
  const contact = getMonetizationAdminContact();
  if (!contact?.displayPhone) {
    return NextResponse.json({ ok: false, error: "admin_phone_not_configured" }, { status: 503 });
  }

  const listing = await prisma.syriaProperty.findFirst({
    where: { id: listingId, ownerId: user.id, status: "PUBLISHED", fraudFlag: false },
  });
  if (!listing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (!f1CanRequestPlan(listing.plan, targetPlan)) {
    return NextResponse.json({ ok: false, error: "invalid_plan_upgrade" }, { status: 400 });
  }

  const views = listing.views ?? 0;
  const ladder = f1ViewTierAndPrices(views);
  const pricingTier = ladder.tier;
  const amount = targetPlan === "featured" ? ladder.featured : ladder.premium;
  const locale = req.headers.get("accept-language")?.toLowerCase().includes("en") ? "en" : "ar";
  const requestId = await prisma.$transaction(async (tx) => {
    const created = await tx.syriaPaymentRequest.create({
      data: {
        listingId,
        plan: targetPlan,
        amount,
        currency: "SYP",
        status: "pending",
        pricingTier,
        note: null,
      },
    });

    await tx.syriaListingFinance.upsert({
      where: { listingId },
      create: {
        listingId,
        totalRequests: 1,
        totalConfirmed: 0,
        lastStatus: "pending",
      },
      update: {
        totalRequests: { increment: 1 },
        lastStatus: "pending",
      },
    });
    return created.id;
  });

  const adCode = listing.adCode?.trim() || listingId;
  const text =
    locale === "en"
      ? f1BuildWhatsAppPaymentTextEn(adCode, targetPlan, amount, requestId)
      : f1BuildWhatsAppPaymentText(adCode, targetPlan, amount, requestId);
  const whatsappUrl = f1BuildWhatsAppUrl(contact.displayPhone, text);

  return NextResponse.json({
    ok: true,
    requestId,
    amount,
    currency: "SYP",
    whatsappUrl,
    /** Days applied on admin confirm (listing.featuredUntil). */
    featuredDurationDays: syriaPlatformConfig.monetization.featuredDurationDays,
  });
}
