import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { scoreOutreachLeadRow } from "@/modules/growth/target-scoring.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      source, 
      referralSource, 
      city, 
      agency, 
      instagramHandle, 
      linkedinUrl, 
      specialization,
      notes
    } = body;

    const score = scoreOutreachLeadRow({
      city: city ?? null,
      source: source || "DIRECT",
      instagramHandle: instagramHandle ?? null,
      linkedinUrl: linkedinUrl ?? null,
      agency: agency ?? null,
      specialization: specialization ?? null,
      notes: notes ?? null,
    });

    const lead = await prisma.outreachLead.create({
      data: {
        name,
        email,
        phone,
        source: source || "DIRECT",
        referralSource,
        status: "NEW",
        city,
        agency,
        instagramHandle,
        linkedinUrl,
        specialization,
        notes,
        score,
        createdByUserId: userId,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[outreach][create] Error:", error);
    return NextResponse.json(
      { error: "Failed to create outreach lead" },
      { status: 500 }
    );
  }
}
