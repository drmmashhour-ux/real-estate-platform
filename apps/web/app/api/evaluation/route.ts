import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { tierFromScore } from "@/lib/ai/lead-tier";
import { logAiEvent } from "@/lib/ai/log";
import {
  sendLeadNotificationToBroker,
  sendPropertyEstimateEmailToUser,
} from "@/lib/email/notifications";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { estimatePublicPropertyValue, type PublicValuationInput } from "@/lib/valuation/public-mvp";
import { resolvePrimaryBrokerUserId } from "@/lib/leads/primary-broker";
import { computeCrmLeadScore } from "@/lib/leads/scoring";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { estimateBrokerCommissionDollars } from "@/lib/leads/commission";
import { scheduleEvaluationEmailJobs } from "@/lib/leads/schedule-eval-email-jobs";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";
import { recordTrafficEventServer } from "@/lib/traffic/record-server-event";
import { dispatchAutomation } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";

/** Stored on lead for CRM / future drip campaigns */
const LEAD_SOURCE_EVALUATION = "evaluation_lead";
const EVALUATION_TYPE = "evaluation";

const ALLOWED_CITIES_DISPLAY = ["Montreal", "Laval", "Quebec"] as const;

function canonicalCity(city: string): string | null {
  const t = city.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (t === "montreal" || t === "montréal") return "Montreal";
  if (t === "laval") return "Laval";
  if (t === "quebec") return "Quebec";
  return null;
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ") ?? "Homeowner";
  return local.slice(0, 1).toUpperCase() + local.slice(1, 80);
}

export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`public:evaluation:${ip}`, { windowMs: 60_000, max: 15 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await req.json().catch(() => ({}));

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address.trim() : "";
  const cityRaw = typeof body.city === "string" ? body.city.trim() : "";
  const propertyType = typeof body.propertyType === "string" ? body.propertyType.trim() : "";
  const bedrooms = Number(body.bedrooms);
  const bathrooms = Number(body.bathrooms);
  const surfaceSqft = Number(body.surfaceSqft);
  const condition = typeof body.condition === "string" ? body.condition.trim() : undefined;

  const city = canonicalCity(cityRaw);
  if (!city) {
    return NextResponse.json(
      {
        error: `Please choose a city: ${ALLOWED_CITIES_DISPLAY.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  if (!address || address.length < 4) {
    return NextResponse.json({ error: "Please enter a valid address." }, { status: 400 });
  }
  if (!propertyType) {
    return NextResponse.json({ error: "Please select a property type." }, { status: 400 });
  }
  if (!Number.isFinite(bedrooms) || bedrooms < 0 || bedrooms > 30) {
    return NextResponse.json({ error: "Please enter a valid number of bedrooms." }, { status: 400 });
  }
  if (!Number.isFinite(bathrooms) || bathrooms < 0 || bathrooms > 30) {
    return NextResponse.json({ error: "Please enter a valid number of bathrooms." }, { status: 400 });
  }
  if (!Number.isFinite(surfaceSqft) || surfaceSqft < 250 || surfaceSqft > 20000) {
    return NextResponse.json({ error: "Please enter living area between 250 and 20,000 sq ft." }, { status: 400 });
  }

  const input: PublicValuationInput = {
    address,
    city,
    propertyType,
    bedrooms,
    bathrooms,
    surfaceSqft,
    condition: condition || undefined,
  };

  const valuation = estimatePublicPropertyValue(input);

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : nameFromEmail(email);
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : "Not provided (online evaluation)";

  const messageLines = [
    `${EVALUATION_TYPE.toUpperCase()} — FREE AI Property Evaluation.`,
    `Address: ${address}`,
    `City: ${city}`,
    `Type: ${propertyType}`,
    `Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}`,
    `Living area: ${surfaceSqft} sq ft`,
    condition ? `Condition: ${condition}` : null,
    `Estimated value: $${valuation.estimatedValue.toLocaleString()} (range $${valuation.rangeMin.toLocaleString()} – $${valuation.rangeMax.toLocaleString()})`,
    `Engine: ${valuation.engine} / ${valuation.engineVersion}`,
  ].filter(Boolean);

  const message = messageLines.join("\n");

  const legacyNlp = scoreLead({
    name,
    email,
    phone,
    message,
  });

  const crm = computeCrmLeadScore({
    city,
    estimatedValue: valuation.estimatedValue,
    surfaceSqft,
    message,
  });
  const finalScore = crm.score;
  const tierLabel = tierFromScore(finalScore);

  const sessionUserId = await getGuestId();
  let linkedUserId: string | undefined;
  if (sessionUserId) {
    const self = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { email: true },
    });
    if (self?.email?.toLowerCase() === email.toLowerCase()) {
      linkedUserId = sessionUserId;
    }
  }

  let aiExplanation: Record<string, unknown> = {
    type: EVALUATION_TYPE,
    leadType: LEAD_SOURCE_EVALUATION,
    evaluationFollowUp: { ready: true, pipeline: "evaluation_lead" },
    evaluationEngagement: { consultationCta: false, call: false, whatsapp: false },
    crmScoring: { score: crm.score, band: crm.band, breakdown: crm.breakdown },
    legacyNlpHint: { score: legacyNlp.score, temperature: legacyNlp.temperature },
    property: {
      address,
      city,
      propertyType,
      bedrooms,
      bathrooms,
      surfaceSqft,
      condition: condition || null,
    },
    valuation: {
      ...valuation,
      input,
    },
  };

  if (linkedUserId) {
    const prof = await prisma.userAiProfile.findUnique({ where: { userId: linkedUserId } });
    if (prof && prof.behaviorLeadScore > 0) {
      aiExplanation = {
        ...aiExplanation,
        behaviorLeadScore: prof.behaviorLeadScore,
      };
    }
  }

  const introducedByBrokerId = await resolvePrimaryBrokerUserId();
  const tenMin = new Date(Date.now() + 10 * 60 * 1000);
  const commEst = estimateBrokerCommissionDollars(valuation.estimatedValue);
  const traffic = getLeadAttributionFromRequest(h.get("cookie"), body);
  const trackingSessionIdEarly =
    typeof body.trackingSessionId === "string" ? body.trackingSessionId.trim().slice(0, 64) : "";

  try {
    const dbLead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        message,
        status: "new",
        pipelineStatus: "new",
        pipelineStage: "new",
        dealValue: valuation.estimatedValue,
        commissionEstimate: commEst ?? undefined,
        score: finalScore,
        userId: linkedUserId,
        aiExplanation: aiExplanation as object,
        contactUnlockedAt: new Date(),
        leadSource: LEAD_SOURCE_EVALUATION,
        aiTier: tierLabel,
        introducedByBrokerId,
        nextFollowUpAt: tenMin,
        nextActionAt: tenMin,
        reminderStatus: "pending",
        source: traffic.source,
        campaign: traffic.campaign,
        medium: traffic.medium,
      },
    });

    if (trackingSessionIdEarly) {
      const pageViews = await prisma.trafficEvent.count({
        where: { sessionId: trackingSessionIdEarly, eventType: "page_view" },
      });
      if (pageViews >= 3) {
        await prisma.lead
          .update({
            where: { id: dbLead.id },
            data: { highIntent: true },
          })
          .catch(() => {});
      }
    }

    await recordTrafficEventServer({
      eventType: "evaluation_submitted",
      path: "/evaluate",
      meta: { leadId: dbLead.id },
      headers: h,
      body,
    });

    const trackingSessionId = trackingSessionIdEarly;
    if (trackingSessionId) {
      await prisma.evaluateFunnelSession
        .updateMany({
          where: { sessionId: trackingSessionId },
          data: { submittedAt: new Date() },
        })
        .catch(() => {});
    }
    if (linkedUserId) {
      await prisma.user
        .update({
          where: { id: linkedUserId },
          data: { isRetargetCandidate: false },
        })
        .catch(() => {});
    }

    await scheduleEvaluationEmailJobs(dbLead.id).catch(() => {});
    void dispatchAutomation("evaluation_submitted", { leadId: dbLead.id }).catch(() => {});

    await appendLeadTimelineEvent(dbLead.id, "evaluation_submitted", {
      city,
      address,
      propertyType,
      estimate: valuation.estimatedValue,
      rangeMin: valuation.rangeMin,
      rangeMax: valuation.rangeMax,
    });

    logAiEvent("lead_scored", {
      leadId: dbLead.id,
      score: finalScore,
      temperature: tierLabel,
      leadSource: LEAD_SOURCE_EVALUATION,
    });

    await sendLeadNotificationToBroker({
      name: dbLead.name,
      email: dbLead.email,
      phone: dbLead.phone,
      message: dbLead.message,
      listingCode: null,
      listingUrl: null,
    });

    const estimateMailSent = await sendPropertyEstimateEmailToUser({
      clientEmail: dbLead.email,
      clientName: dbLead.name,
      estimate: valuation.estimatedValue,
      minValue: valuation.rangeMin,
      maxValue: valuation.rangeMax,
    }).catch(() => false);

    if (estimateMailSent) {
      await prisma.lead
        .update({
          where: { id: dbLead.id },
          data: {
            lastAutomationEmailAt: new Date(),
            evaluationEmailStatus: "instant_sent",
          },
        })
        .catch(() => {});
    }

    await appendLeadTimelineEvent(dbLead.id, "email_sent", {
      template: "evaluation_immediate",
      subject: "Your property estimate is ready",
    });

    return NextResponse.json({
      leadId: dbLead.id,
      valuation: {
        estimate: valuation.estimatedValue,
        minValue: valuation.rangeMin,
        maxValue: valuation.rangeMax,
        estimatedValue: valuation.estimatedValue,
        rangeMin: valuation.rangeMin,
        rangeMax: valuation.rangeMax,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not complete evaluation. Try again later." }, { status: 500 });
  }
}
