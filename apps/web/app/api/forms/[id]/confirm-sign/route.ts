import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendFormSignatureConfirmedToAdmin } from "@/lib/email/notifications";
import { formatFormActivityNote } from "@/lib/forms/form-activity";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const signerName =
      typeof body?.signerName === "string" && body.signerName.trim()
        ? body.signerName.trim()
        : null;
    const signatureText =
      typeof body?.signatureText === "string" && body.signatureText.trim()
        ? body.signatureText.trim()
        : null;
    const signatureDataUrl =
      typeof body?.signatureDataUrl === "string" && body.signatureDataUrl.startsWith("data:image/")
        ? body.signatureDataUrl
        : null;
    const returnNote =
      typeof body?.returnNote === "string" && body.returnNote.trim()
        ? body.returnNote.trim()
        : null;

    const existing = await prisma.formSubmission.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const payload = {
      ...((existing.payloadJson ?? {}) as Record<string, unknown>),
      signatureConfirmedAt: new Date().toISOString(),
      signatureConfirmedBy: signerName || existing.clientName || "Client",
      signatureText: signatureText || signerName || existing.clientName || "Client",
      signatureDataUrl,
      returnedByClientAt: new Date().toISOString(),
      returnNote,
    };

    const submission = await prisma.formSubmission.update({
      where: { id },
      data: {
        status: "completed",
        payloadJson: payload as Prisma.InputJsonValue,
      },
    });

    await prisma.formActivity.create({
      data: {
        formSubmissionId: id,
        action: "signed_and_returned",
        note: formatFormActivityNote(
          "Client",
          `Signed and returned by ${signerName || existing.clientName || "client"}${returnNote ? ` — ${returnNote}` : ""}`
        ),
      },
    });

    await sendFormSignatureConfirmedToAdmin({
      formType: existing.formType,
      submissionId: existing.id,
      clientName: signerName || existing.clientName,
      clientEmail: existing.clientEmail,
    });

    return NextResponse.json({ ok: true, status: submission.status });
  } catch (error) {
    console.error("POST /api/forms/[id]/confirm-sign:", error);
    return NextResponse.json({ error: "Failed to confirm signature." }, { status: 500 });
  }
}
