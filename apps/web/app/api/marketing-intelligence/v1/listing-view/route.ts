import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { MarketingSystemEventCategory } from "@prisma/client";
import { recordFunnelStep } from "@/modules/funnel/funnel.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  listingId: z.string().min(1).max(64),
  sessionId: z.string().max(128).optional(),
  surface: z.enum(["bnhub", "unified_listings"]).optional(),
});

/** Anonymous-safe funnel signal — deduped per user/session + listing per UTC day. */
export async function POST(req: Request) {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ ok: false, skipped: "disabled" }, { status: 200 });
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

  const userId = await getGuestId();
  const dayKey = new Date().toISOString().slice(0, 10);
  const idem = `mi:lv:${parsed.data.listingId}:${userId ?? "anon"}:${parsed.data.sessionId ?? "nosess"}:${dayKey}`;

  const existing = await prisma.marketingSystemEvent.findFirst({
    where: {
      category: MarketingSystemEventCategory.FUNNEL,
      eventKey: "listing_view",
      subjectType: "listing",
      subjectId: parsed.data.listingId,
      meta: { path: ["idempotencyKey"], equals: idem },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await recordFunnelStep({
    step: "listing_view",
    userId,
    sessionId: parsed.data.sessionId ?? null,
    listingId: parsed.data.listingId,
    meta: {
      idempotencyKey: idem,
      surface: parsed.data.surface ?? "bnhub",
    },
  });

  return NextResponse.json({ ok: true });
}
