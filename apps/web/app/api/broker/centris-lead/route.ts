import { NextRequest, NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createBrokerManualCentrisLead } from "@/modules/centris-conversion/centris-broker-intake.service";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
      return NextResponse.json({ error: "Broker access only" }, { status: 403 });
    }

    const body = (await req.json()) as {
      listingId?: string;
      name?: string;
      email?: string;
      phone?: string;
      notes?: string;
      brokerAttestsConsent?: boolean;
    };

    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!listingId || !name) {
      return NextResponse.json({ error: "listingId and name are required." }, { status: 400 });
    }

    const result = await createBrokerManualCentrisLead({
      brokerUserId: userId,
      listingId,
      name,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
      brokerAttestsConsent: body.brokerAttestsConsent === true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, leadId: result.leadId });
  } catch {
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
