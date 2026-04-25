import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../../lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { outcome, notes, nextFollowUpDate } = await req.json();
    
    const existingLead = await prisma.brokerOnboardingLead.findUnique({
      where: { id: params.id },
      select: { notes: true }
    });

    const newNote = `\n[Appel ${new Date().toISOString().split('T')[0]}]: ${outcome}. ${notes || ''}`;
    const updatedNotes = (existingLead?.notes || '') + newNote;

    // Update the lead with the call results
    const lead = await prisma.brokerOnboardingLead.update({
      where: { id: params.id },
      data: {
        lastContactAt: new Date(),
        nextFollowUpAt: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        notes: updatedNotes,
        status: outcome === 'interested' ? 'demo_booked' : undefined,
      },
    });
    
    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
