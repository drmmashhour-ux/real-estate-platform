import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { brokerPlatformPlanBySlug, type BrokerPlatformPlanSlug } from "@/modules/mortgage/services/broker-platform-plans";

const ALLOWED: BrokerPlatformPlanSlug[] = ["free", "gold", "platinum", "ambassador"];

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export const dynamic = "force-dynamic";

/** Public — no auth. Free tier & program interest capture for ops follow-up. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`mortgage:broker_interest:${ip}`, { windowMs: 60_000, max: 8 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Try again in a minute." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    name?: unknown;
    phone?: unknown;
    company?: unknown;
    planSlug?: unknown;
    message?: unknown;
  };

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const planSlugRaw = typeof body.planSlug === "string" ? body.planSlug.trim().toLowerCase() : "free";
  if (!ALLOWED.includes(planSlugRaw as BrokerPlatformPlanSlug)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const planSlug = planSlugRaw as BrokerPlatformPlanSlug;
  const card = brokerPlatformPlanBySlug(planSlug);
  if (!card) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : null;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null;
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 160) : null;
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : null;

  if (planSlug !== "free" && card.requiresAccount) {
    return NextResponse.json(
      {
        error: "Paid tiers use signup and billing. Use the Sign up button on that plan, or choose Partner preview (free).",
        redirectHint: card.ctaHref,
      },
      { status: 400 }
    );
  }

  await prisma.mortgageBrokerProgramInterest.create({
    data: {
      email,
      name: name || null,
      phone: phone || null,
      company: company || null,
      planSlug,
      message: message || null,
      source: "for-brokers",
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Thanks — our partner team will reach out shortly with program details.",
  });
}
