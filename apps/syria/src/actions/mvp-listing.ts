"use server";

import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { persistQuickListing } from "@/lib/persist-quick-listing";

function parseImagesMvp(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * Real-market MVP: minimal fields, live on publish, owner phone for contact.
 */
export async function createMvpPropertyListing(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();

  const titleAr = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const addressDetails = String(formData.get("addressDetails") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "");
  const typeRaw = String(formData.get("type") ?? "SALE").toUpperCase();
  const type = typeRaw === "RENT" ? "RENT" : "SALE";
  const images = parseImagesMvp(String(formData.get("images") ?? ""));
  const amenitiesMvp = formData.getAll("amenities").map((x) => String(x).trim()).filter(Boolean);
  const isDirect = formData.getAll("isDirect").includes("1");

  let proofDocuments: unknown = undefined;
  const proofJson = String(formData.get("proofDocumentsJson") ?? "").trim();
  if (proofJson) {
    try {
      proofDocuments = JSON.parse(proofJson) as unknown;
    } catch {
      const locale = await getLocale();
      redirect({ href: "/sell?af=invalid", locale });
      return;
    }
  }

  if (!["SALE", "RENT"].includes(typeRaw)) {
    return;
  }

  const category = "real_estate";
  const subcategory = type === "RENT" ? "rent" : "sale";

  const out = await persistQuickListing({
    title: titleAr,
    state,
    city,
    area: area || undefined,
    addressDetails: addressDetails || undefined,
    price,
    phoneRaw,
    type,
    category,
    subcategory,
    images,
    amenities: amenitiesMvp,
    source: "mvp_sell",
    isDirect,
    isOwner: formData.getAll("ownershipOwner").includes("1"),
    hasMandate: formData.getAll("ownershipMandate").includes("1"),
    proofDocuments,
  });
  if (!out.ok) {
    const locale = await getLocale();
    const q =
      out.reason === "daily_limit" ? "af=daily"
      : out.reason === "duplicate" ? "af=duplicate"
      : out.reason === "verification_required" ? "af=verify_stay"
      : out.reason === "ownership_required" ? "af=ownership"
      : out.reason === "ownership_phone_mismatch" ? "af=ownership_phone"
      : "af=invalid";
    redirect({ href: `/sell?${q}`, locale });
    return;
  }
  const property = { id: out.id };
  const search =
    out.priceWarningKey === "priceWarnGeneric" || out.priceWarningKey === "priceWarnStay" ? `&af=${out.priceWarningKey}` : "";

  await revalidateSyriaPaths("/sell", "/dashboard/listings", "/buy", "/rent", "/sybnb", "/");
  const locale = await getLocale();
  redirect({ href: `/listing/${property.id}?posted=1${search}`, locale });
}
