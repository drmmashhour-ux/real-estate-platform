import {
  InsuranceLeadSource,
  InsuranceLeadStatus,
  InsuranceLeadType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { logInfo, logWarn } from "@/lib/logger";
import { INSURANCE_LEAD_CONSENT_TEXT } from "@/lib/insurance/consent-text";
import { requireInsuranceAdmin } from "@/lib/insurance/require-insurance-admin";
import { sendInsuranceLeadToPartner } from "@/lib/email/send-insurance-lead";
import { resolveInsuranceListingContext } from "@/lib/insurance/resolve-listing-context";
import { assignInsurancePartner } from "@/lib/insurance/assign-partner";
import { scoreInsuranceLead } from "@/lib/insurance/score-lead";
import { calculateLeadValue } from "@/lib/insurance/pricing";
import {
  trackLeadEvent,
  getLeadConversionStats,
  getLeadSubmissionsByFunnelSource,
  getLeadSubmissionsByLeadType,
} from "@/lib/insurance/lead-analytics";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/insurance/client-ip";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

function parseLeadType(raw: unknown): InsuranceLeadType | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toUpperCase();
  if (u === "TRAVEL" || u === "PROPERTY" || u === "MORTGAGE") return u as InsuranceLeadType;
  const map: Record<string, InsuranceLeadType> = {
    travel: InsuranceLeadType.TRAVEL,
    property: InsuranceLeadType.PROPERTY,
    mortgage: InsuranceLeadType.MORTGAGE,
  };
  return map[raw.trim().toLowerCase()] ?? null;
}

function parseSource(raw: unknown): InsuranceLeadSource | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toUpperCase();
  if (u === "BNBHUB" || u === "LISTING" || u === "CHECKOUT" || u === "MANUAL") {
    return u as InsuranceLeadSource;
  }
  const map: Record<string, InsuranceLeadSource> = {
    bnbhub: InsuranceLeadSource.BNBHUB,
    listing: InsuranceLeadSource.LISTING,
    checkout: InsuranceLeadSource.CHECKOUT,
    manual: InsuranceLeadSource.MANUAL,
  };
  return map[raw.trim().toLowerCase()] ?? null;
}

function notifyEmailForPartner(partnerId: string | null): Promise<string | null> {
  if (partnerId) {
    return prisma.insurancePartner
      .findUnique({ where: { id: partnerId }, select: { contactEmail: true } })
      .then((r) => r?.contactEmail?.trim() ?? null);
  }
  return Promise.resolve(process.env.INSURANCE_OPS_EMAIL?.trim() ?? null);
}

function parseDeviceHeader(request: Request): "web" | "mobile" {
  const d = request.headers.get("x-insurance-device")?.trim().toLowerCase();
  if (d === "mobile" || d === "web") return d;
  return "web";
}

export async function POST(request: Request) {
  const ip = getClientIpFromRequest(request);
  const rl = checkRateLimit(`insurance-lead-post:${ip}`, { windowMs: 60 * 60 * 1000, max: 40 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many submissions from this network. Try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const device = parseDeviceHeader(request);
  const hadConsentIntent = body.consentGiven === true;

  const fail = async (status: number, message: string, source?: InsuranceLeadSource | null, leadType?: InsuranceLeadType | null) => {
    if (hadConsentIntent && source) {
      await trackLeadEvent("lead_failed", {
        source,
        leadType: leadType ?? undefined,
        device,
        metadata: { reason: message },
        clientIp: ip,
      });
    }
    return Response.json({ error: message }, { status, headers: getRateLimitHeaders(rl) });
  };

  if (body.consentGiven !== true) {
    return Response.json({ error: "Consent is required to submit a lead." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    const src = parseSource(body.source);
    const lt = parseLeadType(body.leadType);
    return fail(400, "Valid email is required.", src, lt);
  }

  const leadType = parseLeadType(body.leadType);
  if (!leadType) {
    const src = parseSource(body.source);
    return fail(400, "leadType must be travel, property, or mortgage.", src, null);
  }

  const source = parseSource(body.source);
  if (!source) {
    return fail(400, "source must be bnbhub, listing, checkout, or manual.", null, leadType);
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() || null : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  const message = typeof body.message === "string" ? body.message.trim() || null : null;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() || null : null;
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() || null : null;
  const variantId =
    typeof body.variantId === "string" && body.variantId.length <= 32 ? body.variantId.trim() || null : null;

  const recentDup = await prisma.insuranceLead.findFirst({
    where: {
      email,
      leadType,
      listingId: listingId ?? null,
      bookingId: bookingId ?? null,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recentDup) {
    return fail(
      429,
      "We already received this type of request from you recently for this context. Check your inbox or try again later.",
      source,
      leadType
    );
  }

  const userId = await getGuestId();
  const partnerId = await assignInsurancePartner(leadType);
  const partner = partnerId
    ? await prisma.insurancePartner.findUnique({ where: { id: partnerId } })
    : null;

  const leadScore = scoreInsuranceLead({ phone, bookingId, source, leadType, listingId });
  const estimatedValue = calculateLeadValue(
    { phone, bookingId, source, leadType, listingId, leadScore },
    partner
  );

  const lead = await prisma.insuranceLead.create({
    data: {
      ...(userId ? { userId } : {}),
      email,
      phone,
      fullName,
      leadType,
      listingId,
      bookingId,
      source,
      message,
      consentGiven: true,
      consentText: INSURANCE_LEAD_CONSENT_TEXT,
      status: InsuranceLeadStatus.NEW,
      ...(partnerId ? { partnerId } : {}),
      leadScore,
      estimatedValue,
      ...(variantId ? { variantId } : {}),
    },
  });

  logInfo("insurance_lead_created", { leadId: lead.id, leadType, source, leadScore });

  await trackLeadEvent("lead_submitted", {
    source,
    leadType,
    device,
    leadId: lead.id,
    variantId: variantId ?? undefined,
    clientIp: ip,
  });

  const listingContext = listingId ? await resolveInsuranceListingContext(listingId) : null;
  const to = await notifyEmailForPartner(partnerId);
  if (to) {
    const sent = await sendInsuranceLeadToPartner({
      to,
      leadId: lead.id,
      fullName,
      email,
      phone,
      leadType,
      listingId,
      bookingId,
      message,
      listingContext,
    });
    if (sent) {
      await prisma.insuranceLead.update({
        where: { id: lead.id },
        data: { status: InsuranceLeadStatus.SENT },
      });
    } else {
      logWarn("insurance_lead_email_failed", { leadId: lead.id });
    }
  } else {
    logWarn("insurance_lead_no_notify_target", { leadId: lead.id });
  }

  return Response.json({ ok: true, leadId: lead.id }, { headers: getRateLimitHeaders(rl) });
}

export async function GET(request: Request) {
  const auth = await requireInsuranceAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status")?.trim().toUpperCase();
  const typeRaw = url.searchParams.get("type")?.trim().toUpperCase();
  const includeStats = url.searchParams.get("stats") === "1";

  const where: {
    status?: InsuranceLeadStatus;
    leadType?: InsuranceLeadType;
  } = {};

  if (statusRaw) {
    if (!Object.values(InsuranceLeadStatus).includes(statusRaw as InsuranceLeadStatus)) {
      return Response.json({ error: "Invalid status filter" }, { status: 400 });
    }
    where.status = statusRaw as InsuranceLeadStatus;
  }
  if (typeRaw) {
    if (!Object.values(InsuranceLeadType).includes(typeRaw as InsuranceLeadType)) {
      return Response.json({ error: "Invalid type filter" }, { status: 400 });
    }
    where.leadType = typeRaw as InsuranceLeadType;
  }

  const leads = await prisma.insuranceLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      leadType: true,
      listingId: true,
      bookingId: true,
      source: true,
      message: true,
      consentGiven: true,
      consentText: true,
      status: true,
      partnerId: true,
      estimatedValue: true,
      leadScore: true,
      variantId: true,
      createdAt: true,
      updatedAt: true,
      partner: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
          fixedPricePerLead: true,
          basePricePerLead: true,
          bonusHighQualityLead: true,
        },
      },
    },
  });

  const payload: Record<string, unknown> = { ok: true, leads };

  if (includeStats) {
    const [conversionStats, byFunnel, byLeadType] = await Promise.all([
      getLeadConversionStats(),
      getLeadSubmissionsByFunnelSource(),
      getLeadSubmissionsByLeadType(),
    ]);
    let topFunnel: { funnelSource: string; submissions: number } | null = null;
    for (const row of byFunnel) {
      if (!topFunnel || row.submissions > topFunnel.submissions) topFunnel = row;
    }
    payload.conversionStats = conversionStats;
    payload.submissionsByFunnelSource = byFunnel;
    payload.submissionsByLeadType = byLeadType;
    payload.topFunnelSource = topFunnel?.funnelSource ?? null;
  }

  return Response.json(payload);
}
