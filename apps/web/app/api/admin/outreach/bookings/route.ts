import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const bookings = await prisma.demoBooking.findMany({
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const booking = await prisma.demoBooking.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        city: body.city,
        experience: body.experience,
        scheduledAt: new Date(body.scheduledAt),
        status: "scheduled",
        refId: body.refId,
      },
    });

    // Mock Automated Email Follow-up Trigger
    // In a real system, you'd use a mailer (SendGrid, Resend, etc.) here
    console.log(`[EMAIL_AUTOMATION] Sending Confirmation to ${body.email}`);
    console.log(`
      Subject: Confirmation de votre démo LECIPM
      Body:
      Bonjour ${body.name},
      
      Votre démo est confirmée pour le ${new Date(body.scheduledAt).toLocaleString('fr-CA')}.
      
      En attendant, vous pouvez voir un aperçu rapide ici: https://lecipm.ca/demo/broker
      
      À très bientôt,
      L'équipe LECIPM
    `);

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("[BOOKING_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
