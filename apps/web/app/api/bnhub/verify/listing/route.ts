import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { verifyListingOwnership } from "@/src/modules/bnhub/application/verificationService";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const listing = await verifyListingOwnership({
      listingId: String(body.listingId ?? ""),
      approved: Boolean(body.approved),
    });
    return NextResponse.json({ listing });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

