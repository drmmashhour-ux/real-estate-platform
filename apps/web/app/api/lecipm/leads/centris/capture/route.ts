import { NextRequest, NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { captureCentrisLead } from "@/modules/centris-conversion/centris-capture.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await gateDistributedRateLimit(req, "leads:centris:capture", {
    windowMs: 60_000,
    max: 15,
  });
  if (!gate.allowed) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const listingId = typeof o.listingId === "string" ? o.listingId.trim() : "";
  const intent =
    o.intent === "unlock_analysis" || o.intent === "book_visit" || o.intent === "download_report"
      ? o.intent
      : null;
  const name = typeof o.name === "string" ? o.name : undefined;
  const email = typeof o.email === "string" ? o.email : undefined;
  const phone = typeof o.phone === "string" ? o.phone : undefined;
  const consentPrivacy = o.consentPrivacy === true;
  const consentMarketing = o.consentMarketing === true;

  const bh = o.behaviorHints && typeof o.behaviorHints === "object" ? (o.behaviorHints as Record<string, unknown>) : null;
  const behaviorHints =
    bh &&
    (typeof bh.dwellSeconds === "number" ||
      typeof bh.priorSessionViews === "number" ||
      bh.returningVisitor === true)
      ? {
          ...(typeof bh.dwellSeconds === "number" ? { dwellSeconds: bh.dwellSeconds } : {}),
          ...(typeof bh.priorSessionViews === "number" ? { priorSessionViews: bh.priorSessionViews } : {}),
          ...(bh.returningVisitor === true ? { returningVisitor: true as const } : {}),
        }
      : undefined;

  if (!listingId || !intent) {
    return NextResponse.json({ error: "listingId and valid intent are required." }, { status: 400 });
  }

  const userId = await getGuestId();
  const result = await captureCentrisLead({
    listingId,
    name,
    email,
    phone,
    consentMarketing,
    consentPrivacy,
    intent,
    userId,
    behaviorHints,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, leadId: result.leadId });
}
