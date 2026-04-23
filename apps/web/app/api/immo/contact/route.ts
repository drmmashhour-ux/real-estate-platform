/**
 * POST /api/immo/contact — ImmoContact (internal) / “Contact broker” (public).
 * Captures + qualifies leads, stores CRM row, notifies broker, triggers follow-up + optional AI continuation.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { findRecentListingLeadDuplicate } from "@/lib/crm/lead-dedupe";
import { resolveImmoListing, resolveImmoIntroducedBrokerId } from "@/lib/immo/resolve-listing";
import { scoreImmoLead } from "@/lib/immo/score-immo-lead";
import { logAiEvent } from "@/lib/ai/log";
import {
  sendLeadNotificationToBroker,
  sendImmoContactAcknowledgement,
  bnhubListingPublicUrl,
} from "@/lib/email/notifications";
import { triggerAiFollowUpForLead } from "@/lib/ai/follow-up/orchestrator";
import { appendLeadTimeline } from "@/lib/ai/follow-up/timeline";
import { recordHotLeadAlert } from "@/lib/ai/automation-triggers";
import { LEAD_PIPELINE } from "@/lib/ai/follow-up/pipeline";
import { gateDistributedRateLimit, getClientIpFromRequest } from "@/lib/rate-limit-enforcement";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";
import { fingerprintClientIp } from "@/lib/security/ip-fingerprint";
import { trackMessagingAbuse } from "@/lib/security/security-events";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";
import { defaultImmoResolutionForNewLead } from "@/lib/immo/immo-contact-resolution-metadata";
import { ImmoContactEventType } from "@prisma/client";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { getImmoContactRestriction } from "@/lib/immo/immo-contact-enforcement";
import { isPublicContactDisabled, maintenanceMessage } from "@/lib/security/kill-switches";
import { securityLog } from "@/lib/security/security-logger";

export const dynamic = "force-dynamic";

const SOURCES = new Set(["contact_broker", "book_visit", "chat", "form"]);

export async function POST(req: NextRequest) {
  if (isPublicContactDisabled()) {
    void securityLog({
      event: "contact_blocked_kill_switch",
      persist: true,
      entityId: "immo_contact",
      detail: "public_contact_forms",
    });
    return NextResponse.json(
      { error: maintenanceMessage() ?? "Contact form is temporarily unavailable." },
      { status: 503 }
    );
  }
  const gate = await gateDistributedRateLimit(req, "public:immo-contact", { windowMs: 60_000, max: 12 });
  if (!gate.allowed) {
    const fp = fingerprintClientIp(getClientIpFromRequest(req));
    trackMessagingAbuse({
      detail: "immo_contact_rate_limited",
      ipFingerprint: fp,
      requestId: req.headers.get(REQUEST_ID_HEADER),
    });
    void import("@/lib/fraud/compute-user-risk")
      .then((m) => m.evaluateUserFraudFromMessagingSignals(fp))
      .catch(() => {});
    return gate.response;
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const listingKind = body.listingKind === "crm" ? "crm" : "bnhub";
  const listingRef = String(body.listingRef ?? body.listingId ?? "").trim();
  const sourceRaw = String(body.source ?? "contact_broker");
  const source = SOURCES.has(sourceRaw) ? sourceRaw : "contact_broker";

  const buyingSoon = typeof body.buyingSoon === "string" ? body.buyingSoon.slice(0, 32) : "";
  const budgetRange = typeof body.budgetRange === "string" ? body.budgetRange.slice(0, 32) : "";
  const preApproved = typeof body.preApproved === "string" ? body.preApproved.slice(0, 24) : "";
  const preferredCity = typeof body.preferredCity === "string" ? body.preferredCity.slice(0, 120) : "";
  const preferredProvince = typeof body.preferredProvince === "string" ? body.preferredProvince.slice(0, 64) : "";
  const propertyTypePref = typeof body.propertyType === "string" ? body.propertyType.slice(0, 80) : "";
  const timelinePref = typeof body.timeline === "string" ? body.timeline.slice(0, 64) : "";
  const preferredLanguage = typeof body.preferredLanguage === "string" ? body.preferredLanguage.slice(0, 32) : "";

  const consentSmsWhatsapp = body.consentSmsWhatsapp === true;
  const consentVoice = body.consentVoice === true;
  const aiAssistUsed = body.aiAssistUsed === true;
  const localePref = typeof body.locale === "string" ? body.locale.slice(0, 12) : undefined;

  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
  }
  if (consentSmsWhatsapp && !phone) {
    return NextResponse.json({ error: "Phone required for SMS/WhatsApp consent." }, { status: 400 });
  }

  const snapshot = await resolveImmoListing({
    listingKind: listingKind as "bnhub" | "crm",
    listingRef,
  });
  if (!snapshot) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const sessionForLicense = await getGuestId();
  if (sessionForLicense) {
    const licenseBlock = await requireContentLicenseAccepted(sessionForLicense);
    if (licenseBlock) return licenseBlock;
  }

  const smart = { buyingSoon, budgetRange, preApproved };
  const scored = scoreImmoLead({ name, email, phone, message, smart });

  const immoPayload = {
    version: 1 as const,
    source,
    listingKind: snapshot.kind,
    listingId: snapshot.listingId,
    listingCode: snapshot.listingCode,
    title: snapshot.title,
    location: snapshot.location,
    smart,
    scored: { score: scored.score, temperature: scored.temperature },
  };

  const messageBody = [
    message || "(no message)",
    `— ImmoContact · ${source} · ${snapshot.title}`,
    snapshot.listingCode ? `Listing ID: ${snapshot.listingCode}` : `Listing ref: ${snapshot.listingId}`,
    `Location: ${snapshot.location}`,
    buyingSoon ? `Buying soon: ${buyingSoon}` : "",
    budgetRange ? `Budget: ${budgetRange}` : "",
    preApproved ? `Pre-approved: ${preApproved}` : "",
    preferredCity ? `Preferred city / area: ${preferredCity}` : "",
    preferredProvince ? `Province / region: ${preferredProvince}` : "",
    propertyTypePref ? `Property type: ${propertyTypePref}` : "",
    timelinePref ? `Timeline: ${timelinePref}` : "",
    preferredLanguage ? `Language preference: ${preferredLanguage}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const introducedByBrokerId = await resolveImmoIntroducedBrokerId(snapshot);
  const restriction = await getImmoContactRestriction({
    listingId: snapshot.listingId,
    buyerUserId: sessionForLicense,
    brokerId: introducedByBrokerId,
  });
  if (restriction.blocked) {
    return NextResponse.json(
      {
        error: restriction.reasons[0] ?? "ImmoContact is temporarily restricted for this listing.",
        code: "IMMO_CONTACT_RESTRICTED",
      },
      { status: 403 }
    );
  }

  const duplicate = await findRecentListingLeadDuplicate({
    listingId: snapshot.listingId,
    email,
  });
  if (duplicate) {
    const uidDup = await getGuestId();
    void logImmoContactEvent({
      userId: uidDup,
      listingId: snapshot.listingId,
      listingKind: snapshot.kind,
      contactType: ImmoContactEventType.MESSAGE,
      metadata: {
        source: "immo_contact_duplicate",
        formSource: source,
        immoResolution: { ...defaultImmoResolutionForNewLead(), aiAssistUsed },
      },
      policy: { sourceHub: "buyer", channel: "form", feature: "immo_duplicate" },
    });
    return NextResponse.json({
      ok: true,
      leadId: duplicate.id,
      duplicate: true,
      tier: scored.temperature,
      continueAiChat: true,
      listingTitle: snapshot.title,
    });
  }

  const sessionUserId = await getGuestId();
  let linkedUserId: string | undefined;
  if (sessionUserId) {
    const self = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { email: true },
    });
    if (self?.email && self.email.toLowerCase() === email.toLowerCase()) {
      linkedUserId = sessionUserId;
    }
  }

  const traffic = getLeadAttributionFromRequest(req.headers.get("cookie"), body);

  const dbLead = await prisma.lead.create({
    data: {
      name,
      email,
      phone,
      message: messageBody.slice(0, 12000),
      listingId: snapshot.listingId,
      listingCode: snapshot.listingCode ?? undefined,
      projectId: null,
      status: "new",
      score: scored.score,
      leadSource: "immo_contact",
      aiTier: scored.temperature,
      userId: linkedUserId,
      aiExplanation: {
        immoContact: immoPayload,
        formLine: scored.explanation,
        ...(preferredCity || preferredProvince
          ? {
              property: {
                ...(preferredCity ? { city: preferredCity } : {}),
                ...(preferredProvince ? { province: preferredProvince } : {}),
                ...(propertyTypePref ? { propertyType: propertyTypePref } : {}),
              },
            }
          : {}),
      } as object,
      contactUnlockedAt: new Date(),
      introducedByBrokerId,
      pipelineStatus: scored.temperature === "hot" ? LEAD_PIPELINE.QUALIFIED : LEAD_PIPELINE.NEW,
      source: traffic.source,
      campaign: traffic.campaign,
      medium: traffic.medium,
      contactOrigin: LeadContactOrigin.IMMO_CONTACT,
      commissionSource: LeadContactOrigin.IMMO_CONTACT,
      firstPlatformContactAt: new Date(),
      commissionEligible: true,
    },
  });

  await prisma.leadContactAuditEvent
    .create({
      data: {
        leadId: dbLead.id,
        eventType: "immo_contact_form_submitted",
        actorUserId: linkedUserId ?? undefined,
        listingId: snapshot.listingId,
        metadata: { source } as object,
      },
    })
    .catch(() => {});

  logAiEvent("immo_contact_submitted", {
    leadId: dbLead.id,
    source,
    tier: scored.temperature,
    listingKind: snapshot.kind,
  });

  const listingUrl = bnhubListingPublicUrl(snapshot.listingCode ?? snapshot.listingId);

  await sendLeadNotificationToBroker({
    name,
    email,
    phone,
    message: messageBody,
    listingCode: snapshot.listingCode,
    listingUrl,
  }).catch(() => {});

  await sendImmoContactAcknowledgement(email, name, snapshot.title).catch(() => {});

  if (introducedByBrokerId && scored.temperature === "hot") {
    await recordHotLeadAlert({
      brokerId: introducedByBrokerId,
      leadId: dbLead.id,
      mergedScore: scored.score,
    }).catch(() => {});
  }

  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const clientIp = fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;

  await triggerAiFollowUpForLead({
    leadId: dbLead.id,
    source: `immo_contact:${source}`,
    phone,
    score: scored.score,
    aiTier: scored.temperature,
    listingId: snapshot.listingId,
    introducedByBrokerId: introducedByBrokerId ?? null,
    consent:
      consentSmsWhatsapp || consentVoice
        ? { smsWhatsapp: consentSmsWhatsapp, voice: consentVoice, locale: localePref ?? null }
        : null,
    requestMeta: {
      sourcePage: typeof body.sourcePage === "string" ? body.sourcePage.slice(0, 200) : "/immo-contact",
      ip: clientIp,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
  }).catch(() => {});

  const similarSearchUrl =
    snapshot.kind === "bnhub" && snapshot.location && snapshot.location !== "—"
      ? `/search/bnhub?location=${encodeURIComponent(snapshot.location.split(",")[0]?.trim() ?? "")}`
      : snapshot.kind === "bnhub"
        ? "/search/bnhub"
        : "/listings";

  await appendLeadTimeline(dbLead.id, "immo_contact_captured", {
    source,
    similarSearchUrl,
    listingCode: snapshot.listingCode,
  });

  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    void trackDemoEvent(
      DemoEvents.CONTACT_BROKER,
      { listingId: snapshot.listingId, brokerId: introducedByBrokerId ?? null },
      linkedUserId ?? sessionUserId ?? undefined
    );
  }

  void logImmoContactEvent({
    userId: linkedUserId ?? sessionUserId,
    listingId: snapshot.listingId,
    listingKind: snapshot.kind,
    contactType: ImmoContactEventType.MESSAGE,
    metadata: {
      source: "immo_contact",
      formSource: source,
      leadId: dbLead.id,
      immoResolution: { ...defaultImmoResolutionForNewLead(), aiAssistUsed },
    },
    policy: {
      sourceHub: "buyer",
      channel: "form",
      semantic: "formal_lead",
      leadId: dbLead.id,
      feature: source,
    },
  });

  return NextResponse.json({
    ok: true,
    leadId: dbLead.id,
    tier: scored.temperature,
    continueAiChat: true,
    listingTitle: snapshot.title,
    similarSearchUrl,
  });
}
