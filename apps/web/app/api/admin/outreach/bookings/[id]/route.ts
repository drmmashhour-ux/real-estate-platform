import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const booking = await prisma.demoBooking.update({
      where: { id: params.id },
      data: {
        status: body.status,
      },
    });

    // Mock Follow-up Sequence Triggers
    if (body.status === 'completed') {
      console.log(`[EMAIL_AUTOMATION] Sending POST-DEMO follow-up to ${booking.email}`);
    } else if (body.status === 'no_show') {
      console.log(`[EMAIL_AUTOMATION] Sending NO-SHOW re-scheduling link to ${booking.email}`);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("[BOOKING_PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
