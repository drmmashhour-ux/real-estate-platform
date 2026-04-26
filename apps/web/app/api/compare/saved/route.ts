import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { MAX_COMPARE } from "@/lib/compare/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ listingIds: [] });

  const row = await prisma.propertyComparison.findUnique({
    where: { userId: uid },
    select: { listingIds: true },
  });

  return NextResponse.json({ listingIds: row?.listingIds ?? [] });
}

export async function PUT(request: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { listingIds?: string[] } | null;
  const listingIds = Array.isArray(body?.listingIds)
    ? body!.listingIds!.filter((x) => typeof x === "string").slice(0, MAX_COMPARE)
    : [];

  await prisma.propertyComparison.upsert({
    where: { userId: uid },
    create: { userId: uid, listingIds },
    update: { listingIds },
  });

  return NextResponse.json({ ok: true, listingIds });
}
