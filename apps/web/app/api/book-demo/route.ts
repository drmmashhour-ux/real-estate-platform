import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sendBrokerBookingConfirmation } from "../../../lib/email/broker-outreach-emails";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, city, experience } = body;

    // Default scheduled time to 24h from now for mock purposes, 
    // in real scenario this would come from the picker
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(10, 0, 0, 0);

    const booking = await prisma.demoBooking.create({
      data: {
        name,
        email,
        phone,
        city,
        experience,
        scheduledAt,
        status: "scheduled",
      },
    });

    // Send confirmation email
    await sendBrokerBookingConfirmation(email, name, scheduledAt);

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("[BOOK_DEMO]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
