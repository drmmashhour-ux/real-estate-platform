"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { parseUtmFromFormData } from "@/lib/utm";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";

export async function createPropertyInquiry(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  assertDarlinkRuntimeEnv();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  const utm = parseUtmFromFormData(formData);

  if (!propertyId || !name || !phone) {
    return { ok: false, error: "missing_fields" };
  }

  const property = await prisma.syriaProperty.findUnique({
    where: { id: propertyId },
  });
  if (!property || property.status !== "PUBLISHED") {
    return { ok: false, error: "listing_unavailable" };
  }
  if (property.type === "BNHUB") {
    return { ok: false, error: "use_booking_flow" };
  }

  const session = await getSessionUser();
  const fromUserId = session?.id ?? null;

  const inquiry = await prisma.syriaInquiry.create({
    data: {
      propertyId,
      fromUserId,
      name,
      phone,
      message,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    },
  });

  await trackSyriaGrowthEvent({
    eventType: "inquiry_created",
    userId: fromUserId,
    propertyId,
    inquiryId: inquiry.id,
    utm,
    payload: { name },
  });

  await revalidateSyriaPaths(`/listing/${propertyId}`, "/admin/listings");
  return { ok: true };
}
