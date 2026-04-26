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

  if (!["SALE", "RENT"].includes(typeRaw)) {
    return;
  }

  const out = await persistQuickListing({
    title: titleAr,
    state,
    city,
    area: area || undefined,
    addressDetails: addressDetails || undefined,
    price,
    phoneRaw,
    type,
    images,
    amenities: amenitiesMvp,
    source: "mvp_sell",
  });
  if (!out.ok) {
    return;
  }
  const property = { id: out.id };

  await revalidateSyriaPaths("/sell", "/dashboard/listings", "/buy", "/rent", "/");
  const locale = await getLocale();
  redirect({ href: `/listing/${property.id}?posted=1`, locale });
}
