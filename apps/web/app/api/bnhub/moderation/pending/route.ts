import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const pending = await prisma.shortTermListing.findMany({
    where: { verificationStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, city: true, ownerId: true },
  });
  return NextResponse.json({ pending });
}

