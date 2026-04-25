import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { getListingsPendingVerification } from "@/lib/bnhub/verification";

export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId || !(await isPlatformAdminSurface(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const listings = await getListingsPendingVerification();
    return NextResponse.json(listings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}
