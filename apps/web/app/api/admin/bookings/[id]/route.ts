import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { sendBrokerAfterDemo, sendBrokerNoShow } from "../../../../../../lib/email/broker-outreach-emails";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    
    const booking = await prisma.demoBooking.update({
      where: { id: params.id },
      data: { status },
    });

    // Trigger emails based on status change
    if (status === "completed") {
      await sendBrokerAfterDemo(booking.email, booking.name);
    } else if (status === "no_show") {
      await sendBrokerNoShow(booking.email, booking.name);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
