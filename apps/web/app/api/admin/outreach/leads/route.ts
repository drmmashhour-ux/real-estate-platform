import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const leads = await prisma.brokerOnboardingLead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lead = await prisma.brokerOnboardingLead.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        city: body.city,
        source: body.source,
        status: body.status || "new",
        notes: body.notes,
        ownerUserId: body.ownerUserId,
      },
    });
    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
