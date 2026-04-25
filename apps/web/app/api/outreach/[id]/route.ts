import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { scoreOutreachLeadRow } from "@/modules/growth/target-scoring.service";
import { isBrokerOutreachNotes, type BrokerOutreachNotesJson } from "@/modules/growth/broker-targeting.types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await context.params;
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
      status,
      name,
      email,
      phone,
      notesJson: notesJsonBody,
      lastContactedAt,
      referralSource,
      city,
      agency,
      instagramHandle,
      linkedinUrl,
      specialization,
      notes,
      score: manualScore,
      callBooked,
    } = body;

    const existing = await prisma.outreachLead.findUnique({ where: { id: leadId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let mergedNotes: BrokerOutreachNotesJson | null = isBrokerOutreachNotes(existing.notesJson)
      ? (existing.notesJson as BrokerOutreachNotesJson)
      : {};
    if (notesJsonBody !== undefined) {
      mergedNotes = {
        ...mergedNotes,
        ...(isBrokerOutreachNotes(notesJsonBody) ? notesJsonBody : {}),
      } as BrokerOutreachNotesJson;
    }
    if (callBooked === true) {
      mergedNotes = { ...mergedNotes, callBookedAt: new Date().toISOString() };
    }

    const shouldPatchNotes = notesJsonBody !== undefined || callBooked === true;

    const next = {
      city: city !== undefined ? city : existing.city,
      source: body.source !== undefined ? body.source : existing.source,
      instagramHandle: instagramHandle !== undefined ? instagramHandle : existing.instagramHandle,
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : existing.linkedinUrl,
      agency: agency !== undefined ? agency : existing.agency,
      specialization: specialization !== undefined ? specialization : existing.specialization,
      notes: notes !== undefined ? notes : existing.notes,
    };

    let finalScore = manualScore;
    if (finalScore === undefined) {
      finalScore = scoreOutreachLeadRow({
        city: next.city,
        source: next.source,
        instagramHandle: next.instagramHandle,
        linkedinUrl: next.linkedinUrl,
        agency: next.agency,
        specialization: next.specialization,
        notes: next.notes,
      });
    }

    const lead = await prisma.outreachLead.update({
      where: { id: leadId },
      data: {
        status,
        name,
        email,
        phone,
        notesJson: shouldPatchNotes ? mergedNotes : undefined,
        lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : undefined,
        referralSource,
        city,
        agency,
        instagramHandle,
        linkedinUrl,
        specialization,
        notes,
        score: finalScore,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error(`[outreach][update] Error:`, error);
    return NextResponse.json(
      { error: "Failed to update outreach lead" },
      { status: 500 }
    );
  }
}
