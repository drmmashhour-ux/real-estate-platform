/**
 * POST /api/contact — Submit contact page inquiry (client → platform/broker).
 * Creates a Lead with projectId/listingId null so brokers see it as "Contact page" inquiry.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { logAiEvent } from "@/lib/ai/log";
import {
  sendLeadNotificationToBroker,
  sendClientConfirmationEmail,
} from "@/lib/email/notifications";
import { sendGrowthLeadFollowUpEmail } from "@/lib/growth/lead-nurture";
import { triggerAiFollowUpForLead } from "@/lib/ai/follow-up/orchestrator";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateKey =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
    const limit = checkRateLimit(`public:contact:${rateKey}`, { windowMs: 60_000, max: 15 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const interest = String(body.interest ?? "").trim();
    const locationPreference = String(body.locationPreference ?? "").trim();
    const budget = String(body.budget ?? "").trim();
    const message = String(body.message ?? "").trim();
    const consentSmsWhatsapp = body.consentSmsWhatsapp === true;
    const consentVoice = body.consentVoice === true;
    const localePref = typeof body.locale === "string" ? body.locale.slice(0, 12) : undefined;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (consentSmsWhatsapp && !phone) {
      return NextResponse.json(
        { error: "Phone number is required to receive SMS or WhatsApp follow-up." },
        { status: 400 }
      );
    }
    if (consentVoice && !phone) {
      return NextResponse.json(
        { error: "Phone number is required for automated voice follow-up." },
        { status: 400 }
      );
    }

    const fullMessage = [
      message,
      interest ? `Interest: ${interest}` : "",
      locationPreference ? `Location: ${locationPreference}` : "",
      budget ? `Budget: ${budget}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { score, temperature, explanation } = scoreLead({
      name,
      email,
      phone: phone || undefined,
      message: fullMessage || "Contact page inquiry",
    });

    const traffic = getLeadAttributionFromRequest(req.headers.get("cookie"), body);

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || "",
        message: fullMessage || "General inquiry",
        projectId: null,
        listingId: null,
        status: "contact_inquiry",
        score,
        contactUnlockedAt: new Date(),
        leadSource: "contact_page",
        aiTier: temperature,
        pipelineStatus: "new",
        source: traffic.source,
        campaign: traffic.campaign,
        medium: traffic.medium,
      },
    });

    logAiEvent("contact_inquiry_submitted", {
      leadId: lead.id,
      score,
      temperature,
    });

    await sendLeadNotificationToBroker({
      name,
      email,
      phone: phone || "",
      message: fullMessage || "General inquiry",
    });
    await sendClientConfirmationEmail(email, name);
    void sendGrowthLeadFollowUpEmail(email, name).catch(() => {});

    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const clientIp = fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
    void triggerAiFollowUpForLead({
      leadId: lead.id,
      source: "contact_page",
      phone: lead.phone,
      score,
      aiTier: temperature,
      listingId: null,
      introducedByBrokerId: null,
      consent: {
        smsWhatsapp: consentSmsWhatsapp,
        voice: consentVoice,
        locale: localePref ?? null,
      },
      requestMeta: {
        sourcePage: "/contact",
        ip: clientIp,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      id: lead.id,
      message: "Thank you. We'll respond within one business day.",
    });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
