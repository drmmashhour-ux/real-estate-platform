import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import {
  getSubscriptionPriceCents,
  getSubscriptionPremiumPriceCents,
  getPremiumOneTimeCents,
  getLeadPriceCents,
} from "@/lib/projects-pricing";

export const dynamic = "force-dynamic";

const KEYS = [
  "lead_price_cents",
  "subscription_price_cents",
  "subscription_premium_cents",
  "premium_onetime_cents",
] as const;

export async function GET() {
  try {
    const rows = await prisma.projectPricingConfig.findMany({
      where: { key: { in: [...KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      lead_price_cents: map.lead_price_cents ?? String(getLeadPriceCents()),
      subscription_price_cents: map.subscription_price_cents ?? String(getSubscriptionPriceCents()),
      subscription_premium_cents: map.subscription_premium_cents ?? String(getSubscriptionPremiumPriceCents()),
      premium_onetime_cents: map.premium_onetime_cents ?? String(getPremiumOneTimeCents()),
    });
  } catch (e) {
    console.error("GET /api/admin/projects-pricing:", e);
    return NextResponse.json(
      {
        lead_price_cents: String(getLeadPriceCents()),
        subscription_price_cents: String(getSubscriptionPriceCents()),
        subscription_premium_cents: String(getSubscriptionPremiumPriceCents()),
        premium_onetime_cents: String(getPremiumOneTimeCents()),
      },
      { status: 200 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    for (const key of KEYS) {
      const value = body[key];
      if (value != null && String(value).trim() !== "") {
        const num = Number(value);
        if (!Number.isNaN(num) && num >= 0) {
          await prisma.projectPricingConfig.upsert({
            where: { key },
            create: { key, value: String(Math.round(num)) },
            update: { value: String(Math.round(num)) },
          });
        }
      }
    }
    const rows = await prisma.projectPricingConfig.findMany({
      where: { key: { in: [...KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      lead_price_cents: map.lead_price_cents ?? String(getLeadPriceCents()),
      subscription_price_cents: map.subscription_price_cents ?? String(getSubscriptionPriceCents()),
      subscription_premium_cents: map.subscription_premium_cents ?? String(getSubscriptionPremiumPriceCents()),
      premium_onetime_cents: map.premium_onetime_cents ?? String(getPremiumOneTimeCents()),
    });
  } catch (e) {
    console.error("PATCH /api/admin/projects-pricing:", e);
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}
