import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDefaultPayloadForFormType } from "@/lib/forms/registry";
import { sendFormSubmissionNotificationToAdmin } from "@/lib/email/notifications";
import { formatFormActivityNote } from "@/lib/forms/form-activity";

export const dynamic = "force-dynamic";

/** GET /api/forms – list all form submissions (admin). */
export async function GET() {
  try {
    const list = await prisma.formSubmission.findMany({
      orderBy: { createdAt: "desc" },
      include: { activities: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/forms:", e);
    return NextResponse.json({ error: "Failed to list forms" }, { status: 500 });
  }
}

/** POST /api/forms – create form submission (client or admin). */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const formType = (body.formType as string) || "amendments";
    const payload = (body.payload ?? getDefaultPayloadForFormType(formType)) as Record<string, unknown>;
    const clientName = (body.clientName as string) || null;
    const clientEmail = (body.clientEmail as string) || null;
    const status = (body.status as string) || "draft";

    const submission = await prisma.formSubmission.create({
      data: {
        formType,
        status,
        clientName: clientName || undefined,
        clientEmail: clientEmail || undefined,
        payloadJson: payload as Prisma.InputJsonValue,
      },
    });

    await prisma.formActivity.create({
      data: {
        formSubmissionId: submission.id,
        action: "created",
        note: formatFormActivityNote("Client", status === "submitted" ? "Submitted form" : "Draft created"),
      },
    });

    if (status === "submitted") {
      sendFormSubmissionNotificationToAdmin({
        formType,
        submissionId: submission.id,
        clientName: submission.clientName ?? undefined,
        clientEmail: submission.clientEmail ?? undefined,
      }).catch((e) => console.error("[forms] Admin notification failed:", e));
    }

    return NextResponse.json(submission);
  } catch (e) {
    console.error("POST /api/forms:", e);
    return NextResponse.json({ error: "Failed to create form submission" }, { status: 500 });
  }
}
