import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { MAX_LISTING_CREATE_PAYLOAD_BYTES, MAX_LISTING_IMAGES } from "@/lib/syria/photo-upload";
import { persistQuickListing } from "@/lib/persist-quick-listing";
import { revalidateAllLocaleHomePages } from "@/lib/revalidate-syria-home";
import {
  derivePostingKindFromMarketplace,
  isHighValuePostingKind,
  isKnownPostingKind,
  isLowValuePostingKind,
} from "@/lib/listing-posting-kind";
import {
  defaultSubcategory,
  isMarketplaceCategory,
  isSubcategoryForCategory,
  type MarketplaceCategory,
} from "@/lib/marketplace-categories";
import { consumeAnonymousListingIpSlot } from "@/lib/syria/anonymous-listing-ip-limit";
import { s2GetClientIp } from "@/lib/security/s2-ip";

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

  const payloadUtf8 = Buffer.byteLength(JSON.stringify(body), "utf8");
  if (payloadUtf8 > MAX_LISTING_CREATE_PAYLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const o = body as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title : "";
  const state = typeof o.state === "string" ? o.state : "";
  const city = typeof o.city === "string" ? o.city : "";
  const area = typeof o.area === "string" ? o.area : undefined;
  const addressDetails = typeof o.addressDetails === "string" ? o.addressDetails : undefined;
  const phone = typeof o.phone === "string" ? o.phone : "";
  const posterName = typeof o.name === "string" ? o.name : typeof o.posterName === "string" ? o.posterName : undefined;
  const price = o.price;

  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }
  if (!title.trim() || !state.trim() || !city.trim() || !phone.trim()) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const amenitiesRaw = Array.isArray(o.amenities) ? o.amenities.filter((x): x is string => typeof x === "string") : undefined;
  const descriptionAr = typeof o.description === "string" ? o.description : undefined;
  const contactEmail = typeof o.contactEmail === "string" ? o.contactEmail : undefined;
  const allowPhone = o.allowPhone !== false;
  const allowWhatsApp = o.allowWhatsApp !== false;
  const allowEmail = o.allowEmail === true;
  const allowMessages = o.allowMessages !== false;
  const catIn = typeof o.category === "string" ? o.category : undefined;
  const subIn = typeof o.subcategory === "string" ? o.subcategory : undefined;
  if (subIn && !catIn) {
    return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 });
  }

  let category: MarketplaceCategory = "real_estate";
  let subcategory = "sale";
  if (catIn && isMarketplaceCategory(catIn)) {
    category = catIn;
    if (subIn && isSubcategoryForCategory(catIn, subIn)) {
      subcategory = subIn;
    } else {
      subcategory = defaultSubcategory(catIn);
    }
  }

  const rawPostingKind = typeof o.postingKind === "string" ? o.postingKind.trim() : "";
  if (rawPostingKind && !isKnownPostingKind(rawPostingKind)) {
    return NextResponse.json({ ok: false, error: "invalid_posting_kind" }, { status: 400 });
  }
  const resolvedPostingKind =
    rawPostingKind && isKnownPostingKind(rawPostingKind) ?
      rawPostingKind
    : derivePostingKindFromMarketplace(category, subcategory);

  const session = await getSessionUser();
  const ip = s2GetClientIp(req);

  if (isHighValuePostingKind(resolvedPostingKind) && !session) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  if (isLowValuePostingKind(resolvedPostingKind) && !session) {
    if (!consumeAnonymousListingIpSlot(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limit_anon" }, { status: 429 });
    }
  }

  const imageUrls =
    Array.isArray(o.images) ? o.images.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
  if (imageUrls.length > MAX_LISTING_IMAGES) {
    return NextResponse.json({ ok: false, error: "too_many_images" }, { status: 400 });
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
    images: imageUrls.length > 0 ? imageUrls : undefined,
    amenities: amenitiesRaw,
    descriptionAr,
    source: "quick_post",
    isDirect: o.isDirect !== false,
    contactEmail,
    allowPhone,
    allowWhatsApp,
    allowEmail,
    allowMessages,
    posterName,
    postingKind: rawPostingKind && isKnownPostingKind(rawPostingKind) ? rawPostingKind : undefined,
    isOwner: o.isOwner === true,
    hasMandate: o.hasMandate === true,
    ownerName: typeof o.ownerName === "string" ? o.ownerName : undefined,
    mandateDocumentUrl: typeof o.mandateDocumentUrl === "string" ? o.mandateDocumentUrl : undefined,
    proofDocuments: "proofDocuments" in o ? o.proofDocuments : undefined,
  });

  if (!out.ok) {
    if (out.reason === "verification_required") {
      return NextResponse.json({ ok: false, error: "verification_required" }, { status: 403 });
    }
    if (out.reason === "auth_required") {
      return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
    }
    if (out.reason === "ownership_required") {
      return NextResponse.json({ ok: false, error: "ownership_required" }, { status: 400 });
    }
    if (out.reason === "ownership_phone_mismatch") {
      return NextResponse.json({ ok: false, error: "ownership_phone_mismatch" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  revalidateAllLocaleHomePages();
  return NextResponse.json({ ok: true, id: out.id, adCode: out.adCode });
}
