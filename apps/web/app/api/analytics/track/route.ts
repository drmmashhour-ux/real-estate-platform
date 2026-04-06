import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordTrafficEventServer } from "@/lib/traffic/record-server-event";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { bumpLeadEngagement, dispatchAutomation } from "@/lib/automation/engine";
import { trackEvent } from "@/src/modules/analytics/eventTracker";

export const dynamic = "force-dynamic";

/** All accepted client event_type values */
const ALLOWED = new Set([
  "page_view",
  "evaluation_started",
  "evaluation_submitted",
  "evaluation_submit", // legacy
  "CTA_clicked",
  "call_clicked",
  "whatsapp_clicked",
  "growth_cta",
  "growth_popup_open",
  /** Investment MVP funnel */
  "investment_analyze_click",
  "investment_analyze_cta_click",
  "investment_analyze_run",
  "investment_dashboard_visit",
  "investment_funnel_step",
  "micro_feedback_helpful",
  "investment_deal_saved",
  "investment_compare_used",
  "investment_return_visit",
  "growth_waitlist_signup",
  "shared_deal_page_view",
  "shared_deal_analyze_click",
  "shared_deal_waitlist_email",
  "share_deal_clicked",
  "investment_share_copy_after_analysis",
  "investment_plan_limit_hit",
  "investment_upgrade_click",
  /** Buyer marketplace funnel */
  "listing_view",
  "contact_listing_broker",
  "request_platform_broker",
  "advisory_purchase",
  "mortgage_request",
  /** Growth + monetization funnel */
  "signup_completed",
  "analysis_event",
  "lead_purchased",
  "subscription_purchased",
  "lead_checkout_started",
  "subscription_checkout_started",
  /** Conversion engine events */
  "conversion_track",
  "conversion_trigger",
  "conversion_upgrade_modal_open",
  "conversion_followup_queued",
  /** Growth engine — programmatic SEO city mesh */
  "growth_seo_page_view",
  "growth_seo_lead_capture",
  /** Platform assistant (voice + chat) */
  "assistant_opened",
  "assistant_message_sent",
  "assistant_voice_started",
  "assistant_voice_transcribed",
  "assistant_search_executed",
  "assistant_listing_explained",
  "assistant_compare_used",
  "assistant_help_intent_used",
  "assistant_tts_used",
]);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  const limit = checkRateLimit(`analytics:track:${ip}`, { windowMs: 60_000, max: 240 });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many events" },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await req.json().catch(() => ({}));
  let eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (eventType === "cta_click") eventType = "CTA_clicked";

  if (!ALLOWED.has(eventType)) {
    return NextResponse.json({ ok: false, error: "Invalid eventType" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 2048) : null;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null;
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : null;
  const userId = await getGuestId().catch(() => null);

  await recordTrafficEventServer({
    eventType,
    path,
    meta,
    sessionId,
    headers: req.headers,
    body,
  });

  const trackableMap: Record<string, string> = {
    page_view: "page_view",
    listing_view: "listing_view",
    contact_listing_broker: "inquiry_sent",
    request_platform_broker: "inquiry_sent",
  };
  const mapped = trackableMap[eventType];
  if (mapped) {
    void trackEvent(mapped, meta ?? {}, { userId, sessionId }).catch(() => {});
  }

  const leadIdFromMeta =
    meta && typeof meta.leadId === "string" ? meta.leadId.trim().slice(0, 32) : "";
  if (
    leadIdFromMeta &&
    (eventType === "call_clicked" || eventType === "whatsapp_clicked")
  ) {
    await prisma.lead
      .updateMany({
        where: { id: leadIdFromMeta },
        data: { highIntent: true },
      })
      .catch(() => {});
  }

  if (leadIdFromMeta && !leadIdFromMeta.startsWith("mem-")) {
    if (eventType === "CTA_clicked") {
      const ctaKind =
        meta && typeof meta.ctaKind === "string" ? meta.ctaKind.slice(0, 64) : undefined;
      void dispatchAutomation("CTA_clicked", { leadId: leadIdFromMeta, channel: ctaKind }).catch(
        () => {}
      );
    }
    if (eventType === "call_clicked") {
      void dispatchAutomation("call_clicked", { leadId: leadIdFromMeta }).catch(() => {});
    }
    if (eventType === "whatsapp_clicked") {
      void dispatchAutomation("whatsapp_clicked", { leadId: leadIdFromMeta }).catch(() => {});
    }
    if (eventType === "page_view") {
      void bumpLeadEngagement(leadIdFromMeta, 1).catch(() => {});
    }
  }

  if (eventType === "evaluation_started" && sessionId) {
    await prisma.evaluateFunnelSession
      .upsert({
        where: { sessionId },
        create: {
          sessionId,
          userId: userId ?? undefined,
        },
        update: {
          userId: userId ?? undefined,
        },
      })
      .catch(() => {});

    if (userId) {
      await prisma.user
        .update({
          where: { id: userId },
          data: { isRetargetCandidate: true },
        })
        .catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
