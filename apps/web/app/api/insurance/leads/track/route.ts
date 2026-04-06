import { InsuranceLeadSource, InsuranceLeadType } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/insurance/client-ip";
import { trackLeadEvent, type LeadAnalyticsEventName } from "@/lib/insurance/lead-analytics";

export const dynamic = "force-dynamic";

function parseSource(raw: unknown): InsuranceLeadSource | null {
  if (typeof raw !== "string") return null;
  const map: Record<string, InsuranceLeadSource> = {
    bnbhub: InsuranceLeadSource.BNBHUB,
    listing: InsuranceLeadSource.LISTING,
    checkout: InsuranceLeadSource.CHECKOUT,
    manual: InsuranceLeadSource.MANUAL,
  };
  return map[raw.trim().toLowerCase()] ?? null;
}

function parseLeadType(raw: unknown): InsuranceLeadType | undefined {
  if (typeof raw !== "string") return undefined;
  const map: Record<string, InsuranceLeadType> = {
    travel: InsuranceLeadType.TRAVEL,
    property: InsuranceLeadType.PROPERTY,
    mortgage: InsuranceLeadType.MORTGAGE,
  };
  return map[raw.trim().toLowerCase()];
}

const ALLOWED: Set<LeadAnalyticsEventName> = new Set([
  "lead_form_viewed",
  "lead_started",
  "lead_submitted",
  "lead_failed",
]);

export async function POST(request: Request) {
  const ip = getClientIpFromRequest(request);
  const rl = checkRateLimit(`insurance-track:${ip}`, { windowMs: 60_000, max: 120 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let body: {
    eventName?: string;
    source?: string;
    leadType?: string;
    variantId?: string;
    device?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.eventName as LeadAnalyticsEventName;
  if (!eventName || !ALLOWED.has(eventName)) {
    return Response.json({ error: "Invalid eventName" }, { status: 400 });
  }

  const source = parseSource(body.source);
  if (!source) {
    return Response.json({ error: "Invalid source" }, { status: 400 });
  }

  const leadType = body.leadType ? parseLeadType(body.leadType) : undefined;
  const device = body.device === "mobile" || body.device === "web" ? body.device : "web";

  await trackLeadEvent(eventName, {
    source,
    leadType,
    device,
    variantId: typeof body.variantId === "string" ? body.variantId : undefined,
    clientIp: ip,
  });

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
