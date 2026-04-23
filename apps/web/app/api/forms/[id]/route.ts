import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { sendFormStatusUpdateToClient } from "@/lib/email/notifications";
import { formatFormActivityNote } from "@/lib/forms/form-activity";

export const dynamic = "force-dynamic";

type Params = { id: string };

/** GET /api/forms/[id] – get one form submission. */
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: "desc" } } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (e) {
    console.error("GET /api/forms/[id]:", e);
    return NextResponse.json({ error: "Failed to load form" }, { status: 500 });
  }
}

/** PATCH /api/forms/[id] – update status and/or payload. */
export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.formSubmission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: { status?: string; payloadJson?: object; clientName?: string | null; clientEmail?: string | null; assignedTo?: string | null } = {};
    if (body.status != null) updates.status = String(body.status);
    if (body.payload != null) updates.payloadJson = body.payload as object;
    if (body.clientName !== undefined) updates.clientName = body.clientName ? String(body.clientName) : null;
    if (body.clientEmail !== undefined) updates.clientEmail = body.clientEmail ? String(body.clientEmail) : null;
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo ? String(body.assignedTo) : null;

    const submission = await prisma.formSubmission.update({
      where: { id },
      data: updates,
    });

    const newStatus = body.status != null ? String(body.status) : null;
    await prisma.formActivity.create({
      data: {
        formSubmissionId: id,
        action: newStatus != null ? "status_changed" : "updated",
        note: formatFormActivityNote("Admin", newStatus != null ? `Status set to ${newStatus}` : body.note ?? "Payload updated"),
      },
    });

    if (newStatus != null && existing.clientEmail) {
      sendFormStatusUpdateToClient({
        clientEmail: existing.clientEmail,
        formType: existing.formType,
        submissionId: id,
        status: newStatus,
        clientName: existing.clientName ?? undefined,
      }).catch((e) => console.error("[forms] Status update email failed:", e));
    }

    return NextResponse.json(submission);
  } catch (e) {
    console.error("PATCH /api/forms/[id]:", e);
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 });
  }
}
