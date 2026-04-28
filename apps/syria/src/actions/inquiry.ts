"use server";

import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { parseUtmFromFormData } from "@/lib/utm";
import { submitListingMessage } from "@/lib/syria/listing-message";

export async function createPropertyInquiry(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  assertDarlinkRuntimeEnv();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const utm = parseUtmFromFormData(formData);

  if (!propertyId || !name || !message) {
    return { ok: false, error: "missing_fields" };
  }

  const session = await getSessionUser();

  const out = await submitListingMessage({
    listingId: propertyId,
    name,
    phone: phone.length ? phone : null,
    message,
    utm: {
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    },
    fromUserId: session?.id ?? null,
  });

  if (!out.ok) {
    if (out.error === "listing_unavailable") return { ok: false, error: "listing_unavailable" };
    if (out.error === "use_booking_flow") return { ok: false, error: "use_booking_flow" };
    if (out.error === "messages_disabled") return { ok: false, error: "messages_disabled" };
    return { ok: false, error: "validation" };
  }

  return { ok: true };
}
