import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = await isPlatformAdmin(userId);
  if (!admin && sellerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.sellerDisclosureProfile.findUnique({
    where: { sellerUserId: sellerId },
  });

  return NextResponse.json({ profile });
}
