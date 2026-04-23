import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET — list complaint cases (admin: all or scoped by owner; broker: solo/agency + linked). */
export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const agencyId = url.searchParams.get("agencyId")?.trim() || null;
  const ownerTypeParam = url.searchParams.get("ownerType")?.trim();
  const ownerIdParam = url.searchParams.get("ownerId")?.trim();

  let ownerType = "solo_broker";
  let ownerId = userId;
  if (user.role === PlatformRole.BROKER) {
    if (agencyId) {
      ownerType = "agency";
      ownerId = agencyId;
    }
  }

  const where =
    user.role === PlatformRole.ADMIN && ownerTypeParam && ownerIdParam
      ? { ownerType: ownerTypeParam, ownerId: ownerIdParam }
      : user.role === PlatformRole.ADMIN
        ? {}
        : {
            OR: [
              { ownerType, ownerId },
              { linkedBrokerId: userId },
            ],
          };

  const cases = await prisma.complaintCase.findMany({
    where,
    orderBy: { firstReceivedAt: "desc" },
    take: 200,
    include: {
      _count: { select: { events: true, attachments: true } },
    },
  });

  const counts = {
    new: cases.filter((c) => c.status === "new").length,
    in_review: cases.filter((c) => c.status === "in_review" || c.status === "triaged").length,
    public_assistance: cases.filter((c) => c.status === "escalated_public_assistance").length,
    syndic: cases.filter(
      (c) => c.status === "escalated_syndic_review" || c.routingDecision === "syndic_candidate"
    ).length,
  };

  return NextResponse.json({ success: true, cases, counts });
}
