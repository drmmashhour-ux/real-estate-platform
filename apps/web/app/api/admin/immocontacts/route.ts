/**
 * GET /api/admin/immocontacts — ImmoContact-origin leads (admin).
 */

import { NextResponse } from "next/server";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leads = await prisma.lead.findMany({
    where: { contactOrigin: LeadContactOrigin.IMMO_CONTACT },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      listingId: true,
      listingCode: true,
      createdAt: true,
      firstPlatformContactAt: true,
      commissionEligible: true,
      commissionSource: true,
      userId: true,
      introducedByBrokerId: true,
      deal: { select: { id: true, status: true, possibleBypassFlag: true, commissionSource: true } },
      introducedByBroker: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ leads });
}
