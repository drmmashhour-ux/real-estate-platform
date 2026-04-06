import { NextResponse } from "next/server";
import { z } from "zod";
import type { ListingContactTargetKind } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { buyerHasPaidListingContact, isListingContactPaywallEnabled } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = z
    .object({
      listingId: z.string().min(1),
      targetKind: z.enum(["FSBO_LISTING", "CRM_LISTING"]),
    })
    .safeParse({
      listingId: searchParams.get("listingId") ?? "",
      targetKind: searchParams.get("targetKind") ?? "",
    });
  if (!parsed.success) {
    return NextResponse.json({ error: "listingId and targetKind required" }, { status: 400 });
  }

  const paywall = isListingContactPaywallEnabled();
  const userId = await getGuestId();
  if (!paywall) {
    return NextResponse.json({ paywallEnabled: false, unlocked: true, signedIn: Boolean(userId) });
  }
  if (!userId) {
    return NextResponse.json({ paywallEnabled: true, unlocked: false, signedIn: false });
  }

  const kind = parsed.data.targetKind as ListingContactTargetKind;
  const unlocked = await buyerHasPaidListingContact(userId, kind, parsed.data.listingId);
  return NextResponse.json({ paywallEnabled: true, unlocked, signedIn: true });
}
