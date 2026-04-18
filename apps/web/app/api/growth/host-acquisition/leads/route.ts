import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * GET /api/growth/host-acquisition/leads — pipeline list (admin). CRM `Lead` remains under GET /api/leads.
 */
export async function GET() {
  if (!engineFlags.hostAcquisitionV1) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await isPlatformAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.listingAcquisitionLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      city: true,
      propertyCategory: true,
      sourceType: true,
      intakeStatus: true,
      permissionStatus: true,
      sourceListingUrl: true,
      linkedFsboListingId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, leads: rows });
}
