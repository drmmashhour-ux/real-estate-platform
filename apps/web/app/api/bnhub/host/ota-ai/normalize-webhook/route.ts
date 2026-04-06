import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  normalizeWebhookPayloadWithAi,
  persistOtaAiTrace,
} from "@/lib/bnhub/ota-channel-ai";
import { ingestExternalReservationWebhook } from "@/lib/bnhub/channel-integration";

export const dynamic = "force-dynamic";

/**
 * POST { payload: unknown, dryRun?: boolean, listingId?: string }
 * AI maps arbitrary channel-manager JSON → normalized reservation fields; optional dry-run.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    payload?: unknown;
    dryRun?: boolean;
    listingId?: string;
  };

  if (body.payload === undefined) {
    return NextResponse.json({ error: "payload required" }, { status: 400 });
  }

  const str = typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload);
  const normalized = await normalizeWebhookPayloadWithAi(body.payload);

  await persistOtaAiTrace({
    userId,
    listingId: typeof body.listingId === "string" ? body.listingId : null,
    traceType: "webhook_normalize",
    sourceLabel: normalized.normalized?.platform ?? "unknown",
    inputText: str.slice(0, 32000),
    result: {
      normalized: normalized.normalized,
      confidence: normalized.confidence,
      source: normalized.source,
      notes: normalized.notes,
    },
    model: process.env.OPENAI_OTA_PARSE_MODEL ?? "gpt-4o-mini",
  });

  if (body.dryRun || !normalized.normalized) {
    return NextResponse.json({
      dryRun: true,
      ...normalized,
    });
  }

  const n = normalized.normalized;
  const ingest = await ingestExternalReservationWebhook({
    platform: n.platform,
    externalListingId: n.externalListingId,
    reservation_id: n.reservation_id,
    check_in: n.check_in,
    check_out: n.check_out,
    cancelled: n.cancelled,
  });

  return NextResponse.json({
    ...normalized,
    ingest,
  });
}
