import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET — all contracts for admin (filter: type prefix or contains).
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const typeFilter = (searchParams.get("type") ?? "").trim();
  const q = (searchParams.get("q") ?? "").trim();
  const take = Math.min(300, Math.max(20, parseInt(searchParams.get("take") ?? "120", 10) || 120));

  const rows = await prisma.contract.findMany({
    where: {
      ...(typeFilter
        ? { type: { contains: typeFilter, mode: "insensitive" } }
        : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      signed: true,
      signedAt: true,
      version: true,
      userId: true,
      listingId: true,
      fsboListingId: true,
      bookingId: true,
      user: { select: { email: true, name: true } },
      createdAt: true,
    },
  });

  return NextResponse.json({ data: rows });
}
