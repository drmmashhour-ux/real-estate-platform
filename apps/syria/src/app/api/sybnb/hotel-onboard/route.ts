import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { persistSybnbHotelOnboarding } from "@/lib/sybnb/sybnb-hotel-onboard-persist";
import { sybnbHotelOnboardBodySchema } from "@/lib/sybnb/sybnb-hotel-onboard-schema";
import { revalidateAllLocaleHomePages } from "@/lib/revalidate-syria-home";

export const runtime = "nodejs";

/** ORDER SYBNB-53 — Auto-publish HOTEL listing + CRM lead (public; agents may submit on behalf). */
export async function POST(req: Request): Promise<Response> {
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
