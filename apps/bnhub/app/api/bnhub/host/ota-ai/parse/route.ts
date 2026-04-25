import { NextRequest, NextResponse } from "next/server";
import { BnhubChannelPlatform } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";
import {
  parseOtaListingReference,
  persistOtaAiTrace,
} from "@/lib/bnhub/ota-channel-ai";

export const dynamic = "force-dynamic";

/**
 * POST { url?: string, text?: string, listingId?: string }
 * AI + rules: suggest platform + external property id from pasted OTA / metasearch links (no scraping).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    text?: string;
    listingId?: string;
  };

  const url = typeof body.url === "string" ? body.url.trim() : undefined;
  const text = typeof body.text === "string" ? body.text.trim() : undefined;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : undefined;

  if (!url && !text) {
    return NextResponse.json({ error: "Provide url and/or text" }, { status: 400 });
  }

  if (listingId) {
    const gate = await assertListingOwner(userId, listingId);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }
  }

  const result = await parseOtaListingReference({ url, text });
  const inputBlob = `${url ?? ""}\n${text ?? ""}`;

  await persistOtaAiTrace({
    userId,
    listingId: listingId ?? null,
    traceType: "listing_reference",
    sourceLabel: result.platform ?? "unknown",
    inputText: inputBlob,
    result: { ...result, platform: result.platform ?? null },
    model: process.env.OPENAI_OTA_PARSE_MODEL ?? "gpt-4o-mini",
  });

  return NextResponse.json({
    suggestion: {
      platform: result.platform,
      externalPropertyId: result.externalPropertyId,
      propertyNameGuess: result.propertyNameGuess,
      nightlyPriceCentsGuess: result.nightlyPriceCentsGuess,
      currencyGuess: result.currencyGuess,
      confidence: result.confidence,
      source: result.source,
      notes: result.notes,
    },
    applyHint:
      result.platform &&
      result.externalPropertyId &&
      listingId &&
      Object.values(BnhubChannelPlatform).includes(result.platform)
        ? `POST /api/bnhub/host/listings/${listingId}/external-mapping with { platform, externalId }`
        : null,
  });
}
