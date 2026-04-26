import { NextResponse } from "next/server";
import { z } from "zod";
import { MarketingSystemEventCategory } from "@prisma/client";
import { engineFlags, landingConversionFlags } from "@/config/feature-flags";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireUser } from "@/modules/security/access-guard.service";
import { hasPerformanceIdempotencyKey, recordPerformanceEvent } from "@/modules/marketing-performance";
import { recordFunnelStep } from "@/modules/funnel/funnel.service";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("performance"),
    eventKey: z.string().min(1).max(64),
    subjectType: z.enum(["campaign", "listing", "blog", "studio"]).optional(),
    subjectId: z.string().max(64).optional(),
    amountCents: z.number().int().optional(),
    /** Dedup key stored in meta — same key returns ok without a second row. */
    idempotencyKey: z.string().min(1).max(128).optional(),
    meta: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    kind: z.literal("funnel"),
    step: z.string().min(1).max(64),
    listingId: z.string().optional(),
    blogId: z.string().optional(),
    campaignId: z.string().optional(),
    sessionId: z.string().max(128).optional(),
    idempotencyKey: z.string().min(1).max(128).optional(),
    meta: z.record(z.string(), z.any()).optional(),
    /** Unauthenticated ads landing funnel — same storage as authenticated funnel rows. */
    publicAdsLanding: z.boolean().optional(),
  }),
]);

const PUBLIC_FUNNEL_STEPS = new Set(["landing_view", "cta_click", "listing_view", "lead_submit"]);

export async function POST(req: Request) {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ error: "Marketing intelligence is disabled" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  if (parsed.data.kind === "funnel" && parsed.data.publicAdsLanding === true) {
    if (!landingConversionFlags.landingPagesV1) {
      return NextResponse.json({ error: "Public landing funnel is disabled" }, { status: 403 });
    }
    const idem = parsed.data.idempotencyKey?.trim();
    if (!idem) {
      return NextResponse.json({ error: "idempotencyKey is required for public funnel events" }, { status: 400 });
    }
    if (!PUBLIC_FUNNEL_STEPS.has(parsed.data.step)) {
      return NextResponse.json({ error: "Step not allowed for public funnel" }, { status: 400 });
    }
    const dup = await prisma.marketingSystemEvent.findFirst({
      where: {
        category: MarketingSystemEventCategory.FUNNEL,
        meta: { path: ["idempotencyKey"], equals: idem },
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    const meta = {
      ...(parsed.data.meta ?? {}),
      idempotencyKey: idem,
      /** Required for public ads landing funnel — validated server-side (not client-controlled). */
      source: "ads_landing_beacon" as const,
    };
    await recordFunnelStep({
      step: parsed.data.step,
      userId: null,
      sessionId: parsed.data.sessionId ?? null,
      listingId: parsed.data.listingId ?? null,
      blogId: parsed.data.blogId ?? null,
      campaignId: parsed.data.campaignId ?? null,
      meta,
    });
    return NextResponse.json({ ok: true });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (parsed.data.kind === "performance") {
    const meta = {
      ...(parsed.data.meta ?? {}),
      ...(parsed.data.idempotencyKey ? { idempotencyKey: parsed.data.idempotencyKey } : {}),
    };
    const before =
      parsed.data.idempotencyKey &&
      (await import("@/modules/marketing-performance").then((m) =>
        m.hasPerformanceIdempotencyKey(parsed.data.idempotencyKey!)
      ));
    if (before) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await recordPerformanceEvent({
      userId: auth.userId,
      eventKey: parsed.data.eventKey,
      subjectType: parsed.data.subjectType ?? null,
      subjectId: parsed.data.subjectId ?? null,
      amountCents: parsed.data.amountCents ?? null,
      meta: Object.keys(meta).length ? meta : undefined,
    });
  } else {
    const meta = {
      ...(parsed.data.meta ?? {}),
      ...(parsed.data.idempotencyKey ? { idempotencyKey: parsed.data.idempotencyKey } : {}),
    };
    if (parsed.data.idempotencyKey) {
      const dup = await prisma.marketingSystemEvent.findFirst({
        where: {
          category: MarketingSystemEventCategory.FUNNEL,
          meta: { path: ["idempotencyKey"], equals: parsed.data.idempotencyKey },
        },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }
    await recordFunnelStep({
      step: parsed.data.step,
      userId: auth.userId,
      sessionId: parsed.data.sessionId ?? null,
      listingId: parsed.data.listingId ?? null,
      blogId: parsed.data.blogId ?? null,
      campaignId: parsed.data.campaignId ?? null,
      meta: Object.keys(meta).length ? meta : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
