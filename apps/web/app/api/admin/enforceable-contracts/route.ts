import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET — search enforceable contracts (admin).
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const filterUser = (searchParams.get("userId") ?? "").trim();
  const filterListing = (searchParams.get("listingId") ?? "").trim();
  const take = Math.min(200, Math.max(10, parseInt(searchParams.get("take") ?? "80", 10) || 80));

  const rows = await prisma.contract.findMany({
    where: {
      type: { startsWith: "enforceable_" },
      ...(filterUser ? { userId: filterUser } : {}),
      ...(filterListing
        ? {
            OR: [{ listingId: filterListing }, { fsboListingId: filterListing }],
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { id: { contains: q, mode: "insensitive" } },
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
      version: true,
      signed: true,
      signedAt: true,
      signerIpAddress: true,
      userId: true,
      listingId: true,
      fsboListingId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: rows });
}
