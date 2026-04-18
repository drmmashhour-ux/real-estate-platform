import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags, landingConversionFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { capturePublicLandingLead } from "@/modules/lead-gen/lead-capture.service";
import { emitPublicLandingLeadFunnel } from "@/modules/marketing-intelligence/activation.service";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";

const publicBodySchema = z
  .object({
    /** Discriminator — must be true for unauthenticated public capture via POST /api/growth/leads/capture */
    publicAcquisition: z.literal(true),
    name: z.string().min(1).max(200),
    email: z.string().email().optional(),
    phone: z.string().max(40).optional(),
    message: z.string().max(8000).optional(),
    /** Alias for campaign vertical; maps to CRM intent. */
    intent: z.enum(["bnhub", "host", "buy"]).optional(),
    source: z.enum(["facebook", "google", "other"]),
    campaignType: z.enum(["bnhub", "host", "buy"]),
    sessionId: z.string().max(128).optional(),
    referrerUrl: z.string().max(2000).optional(),
  })
  .refine((d) => Boolean(d.email?.trim()) || Boolean(d.phone?.trim()), {
    message: "Provide email or phone",
  });

function intentForCampaign(t: "bnhub" | "host" | "buy"): "buyer" | "renter" | "host" {
  if (t === "host") return "host";
  if (t === "buy") return "buyer";
  return "renter";
}

/** Shared handler for public landing leads (used by `/capture` and `/capture-public`). */
export async function handlePublicLandingCaptureJson(body: unknown, req?: Request): Promise<NextResponse> {
  if (!landingConversionFlags.landingPagesV1) {
    return NextResponse.json({ error: "Landing lead capture is disabled" }, { status: 403 });
  }

  const parsed = publicBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const d = parsed.data;
  const vertical = d.intent ?? d.campaignType;
  const campaign = `ads_landing:${vertical}:${d.source}`;

  const result = await capturePublicLandingLead({
    name: d.name,
    email: d.email,
    phone: d.phone,
    message: d.message,
    intentCategory: intentForCampaign(vertical),
    source: d.source,
    campaign,
    medium: "cpc",
    referrerUrl: d.referrerUrl ?? null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (!result.duplicate && engineFlags.marketingIntelligenceV1) {
    await emitPublicLandingLeadFunnel({
      leadId: result.id,
      sessionId: d.sessionId ?? null,
      campaign,
      source: d.source,
    }).catch(() => {});
  }

  if (!result.duplicate) {
    const guestId = await getGuestId().catch(() => null);
    void recordGrowthEvent({
      eventName: GrowthEventName.LEAD_CAPTURE,
      userId: guestId,
      sessionId: d.sessionId?.slice(0, 64) ?? null,
      idempotencyKey: `lead_capture:${result.id}`.slice(0, 160),
      metadata: {
        leadId: result.id,
        campaign,
        vertical,
        source: d.source,
        surface: "public_landing",
      },
      cookieHeader: req?.headers.get("cookie") ?? null,
      body,
      pageUrl: req?.url ?? null,
      referrerHeader: req?.headers.get("referer"),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: result.id, duplicate: result.duplicate });
}
