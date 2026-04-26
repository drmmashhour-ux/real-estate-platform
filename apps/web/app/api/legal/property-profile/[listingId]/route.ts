import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const scope = request.nextUrl.searchParams.get("scope") === "BNHUB" ? "BNHUB" : "FSBO";

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = await isPlatformAdmin(userId);
  if (scope === "FSBO") {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!admin && listing.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const profile = await prisma.propertyLegalProfile.findUnique({
    where: { listingScope_listingId: { listingScope: scope, listingId } },
  });

  return NextResponse.json({ profile });
}
