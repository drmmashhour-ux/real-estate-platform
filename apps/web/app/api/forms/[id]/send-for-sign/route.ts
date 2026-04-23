import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { sendFormSignatureRequestToClient } from "@/lib/email/notifications";
import { formatFormActivityNote } from "@/lib/forms/form-activity";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function POST(_req: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    if (!submission.clientEmail) {
      return NextResponse.json({ error: "Client email is required before sending for signature." }, { status: 400 });
    }

    const publicUrlBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const reviewUrl = publicUrlBase ? `${publicUrlBase}/forms/file/${submission.id}` : undefined;

    await sendFormSignatureRequestToClient({
      clientEmail: submission.clientEmail,
      clientName: submission.clientName,
      formType: submission.formType,
      submissionId: submission.id,
      reviewUrl,
    });

    const nextStatus = submission.status === "draft" ? "submitted" : submission.status;
    if (nextStatus !== submission.status) {
      await prisma.formSubmission.update({
        where: { id: submission.id },
        data: { status: nextStatus },
      });
    }

    await prisma.formActivity.create({
      data: {
        formSubmissionId: submission.id,
        action: "sent_for_signature",
        note: formatFormActivityNote("System", `Sent signature request to ${submission.clientEmail}`),
      },
    });

    return NextResponse.json({ ok: true, reviewUrl, status: nextStatus });
  } catch (error) {
    console.error("POST /api/forms/[id]/send-for-sign:", error);
    return NextResponse.json({ error: "Failed to send signature email." }, { status: 500 });
  }
}
