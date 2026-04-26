import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAdminSession } from "@/lib/admin/require-admin";
import { updateListingQuality } from "@/lib/quality/update-listing-quality";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await ctx.params;

  const admin = await requireAdminSession();
  if (admin.ok) {
    await updateListingQuality(listingId);
    return NextResponse.json({ ok: true, source: "admin" });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const owned = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await updateListingQuality(listingId);
  return NextResponse.json({ ok: true, source: "host" });
}
