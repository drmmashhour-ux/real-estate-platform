import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { MAX_LISTING_CREATE_PAYLOAD_BYTES } from "@/lib/syria/photo-upload";
import { persistSybnbHotelOnboarding } from "@/lib/sybnb/sybnb-hotel-onboard-persist";
import { sybnbHotelOnboardBodySchema } from "@/lib/sybnb/sybnb-hotel-onboard-schema";
import { revalidateAllLocaleHomePages } from "@/lib/revalidate-syria-home";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ORDER SYBNB-53 — Auto-publish HOTEL listing + CRM lead (public; agents may submit on behalf). */
async function handleHotelOnboardPOST(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const payloadUtf8 = Buffer.byteLength(JSON.stringify(json), "utf8");
  if (payloadUtf8 > MAX_LISTING_CREATE_PAYLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const parsed = sybnbHotelOnboardBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const { hotelName, city, phone, images } = parsed.data;

  const out = await persistSybnbHotelOnboarding({
    hotelName,
    cityRaw: city,
    phoneRaw: phone,
    ...(images?.length ? { images } : {}),
  });

  if (!out.ok) {
    if (out.reason === "duplicate") {
      return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    }
    if (out.reason === "daily_limit") {
      return NextResponse.json({ ok: false, error: "daily_limit" }, { status: 429 });
    }
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  revalidateAllLocaleHomePages();
  return NextResponse.json({
    ok: true,
    listingId: out.listingId,
    adCode: out.adCode,
    leadId: out.leadId,
    pricePerNight: out.pricePerNight,
  });
}

export async function POST(req: Request): Promise<Response> {
  return sybnbApiCatch(() => handleHotelOnboardPOST(req));
}
