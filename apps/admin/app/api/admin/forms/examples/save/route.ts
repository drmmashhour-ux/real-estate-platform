import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import { formatFormActivityNote } from "@/lib/forms/form-activity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const formType =
    typeof body?.formType === "string" && body.formType.trim()
      ? body.formType.trim()
      : "oaciq-refill-draft";
  const sourceFileName =
    typeof body?.sourceFileName === "string" && body.sourceFileName.trim()
      ? body.sourceFileName.trim()
      : null;
  const payload =
    body?.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : null;

  if (!payload) {
    return NextResponse.json({ error: "Provide payload to save." }, { status: 400 });
  }

  const inferredClientName =
    typeof payload.buyer_name === "string" && payload.buyer_name.trim()
      ? payload.buyer_name.trim()
      : typeof payload.seller_name === "string" && payload.seller_name.trim()
        ? payload.seller_name.trim()
        : null;

  const inferredClientEmail =
    typeof payload.email === "string" && payload.email.trim() ? payload.email.trim() : null;

  const submission = await prisma.formSubmission.create({
    data: {
      formType,
      status: "draft",
      clientName: inferredClientName,
      clientEmail: inferredClientEmail,
      payloadJson: payload as Prisma.InputJsonValue,
    },
  });

  await prisma.formActivity.create({
    data: {
      formSubmissionId: submission.id,
      action: "created",
      note: formatFormActivityNote(
        "System",
        sourceFileName ? `Draft generated from uploaded form: ${sourceFileName}` : "Draft generated from AI refill example"
      ),
    },
  });

  return NextResponse.json({
    ok: true,
    submissionId: submission.id,
    redirectTo: `/admin/forms/${submission.id}`,
  });
}
