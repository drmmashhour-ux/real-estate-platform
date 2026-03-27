import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const services = await prisma.bnhubService.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return Response.json({ services });
}

export async function PATCH(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as {
    id?: string;
    isActive?: boolean;
    isPremiumTier?: boolean;
    minListingTrustScore?: number | null;
  };
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.bnhubService.update({
    where: { id: body.id },
    data: {
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.isPremiumTier !== undefined ? { isPremiumTier: body.isPremiumTier } : {}),
      ...(body.minListingTrustScore !== undefined
        ? { minListingTrustScore: body.minListingTrustScore }
        : {}),
    },
  });
  return Response.json({ service: updated });
}
