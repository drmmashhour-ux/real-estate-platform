import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags, landingConversionFlags, softLaunchFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { recordFunnelStep } from "@/modules/funnel/funnel.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  step: z.enum(["landing_view", "cta_click", "listing_view"]),
  sessionId: z.string().max(128).optional(),
  listingId: z.string().max(64).optional(),
  path: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
  /** Distinguish acquisition landings from generic soft-launch beacons. */
  beacon: z.enum(["soft_launch", "ads_landing"]).optional(),
});

/** POST — landing / CTA funnel signals (idempotent; anonymous-safe with session). */
export async function POST(req: Request) {
  const allowBeacon =
    engineFlags.marketingIntelligenceV1 &&
    (softLaunchFlags.softLaunchV1 || landingConversionFlags.landingPagesV1);
  if (!allowBeacon) {
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
  const idem =
    parsed.data.idempotencyKey ??
    `mi:sl:${parsed.data.step}:${userId ?? "anon"}:${parsed.data.sessionId ?? "nosess"}:${parsed.data.listingId ?? ""}:${parsed.data.path ?? ""}:${dayKey}`;

  await recordFunnelStep({
    step: parsed.data.step,
    userId,
    sessionId: parsed.data.sessionId ?? null,
    listingId: parsed.data.listingId ?? null,
    meta: {
      idempotencyKey: idem,
      path: parsed.data.path,
      source: parsed.data.beacon === "ads_landing" ? "ads_landing_beacon" : "soft_launch_beacon",
    },
  });

  return NextResponse.json({ ok: true });
}
