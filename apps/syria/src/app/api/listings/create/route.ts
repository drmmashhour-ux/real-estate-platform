import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { persistQuickListing } from "@/lib/persist-quick-listing";
import { revalidateAllLocaleHomePages } from "@/lib/revalidate-syria-home";
import { parseMarketplacePair } from "@/lib/marketplace-categories";

export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title : "";
  const state = typeof o.state === "string" ? o.state : "";
  const city = typeof o.city === "string" ? o.city : "";
  const area = typeof o.area === "string" ? o.area : undefined;
  const addressDetails = typeof o.addressDetails === "string" ? o.addressDetails : undefined;
  const phone = typeof o.phone === "string" ? o.phone : "";
  const price = o.price;

  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }
  if (!title.trim() || !state.trim() || !city.trim() || !phone.trim()) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const amenitiesRaw = Array.isArray(o.amenities) ? o.amenities.filter((x): x is string => typeof x === "string") : undefined;
  const descriptionAr = typeof o.description === "string" ? o.description : undefined;
  const catIn = typeof o.category === "string" ? o.category : undefined;
  const subIn = typeof o.subcategory === "string" ? o.subcategory : undefined;
  if (subIn && !catIn) {
    return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 });
  }
  if (catIn) {
    const pair = parseMarketplacePair(catIn, subIn);
    if (!pair) {
      return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 });
    }
  }

  const out = await persistQuickListing({
    title,
    state,
    city,
    area,
    addressDetails,
    price,
    phoneRaw: phone,
    type: o.type === "RENT" ? "RENT" : "SALE",
    category: catIn,
    subcategory: subIn,
    images: Array.isArray(o.images)
      ? o.images.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 5)
      : undefined,
    amenities: amenitiesRaw,
    descriptionAr,
    source: "quick_post",
    isDirect: o.isDirect !== false,
  });

  if (!out.ok) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  revalidateAllLocaleHomePages();
  return NextResponse.json({ ok: true, id: out.id, adCode: out.adCode });
}
