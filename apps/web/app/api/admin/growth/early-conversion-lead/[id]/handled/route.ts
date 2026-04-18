import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

export const dynamic = "force-dynamic";

const FORM_TYPE = "early_conversion_lead";

type Params = Promise<{ id: string }>;

/** Mark an early conversion lead as handled (payloadJson.metadata.handled = true). Admin only. */
export async function PATCH(_req: Request, { params }: { params: Params }) {
  const userId = await getGuestId();
  if (!(await requireAdminUser(userId))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const row = await prisma.formSubmission.findFirst({
    where: { id, formType: FORM_TYPE },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing =
    row.payloadJson && typeof row.payloadJson === "object"
      ? (row.payloadJson as Record<string, unknown>)
      : {};
  const prevMeta =
    existing.metadata && typeof existing.metadata === "object"
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const payloadJson = {
    ...existing,
    metadata: {
      ...prevMeta,
      handled: true,
    },
  };

  await prisma.formSubmission.update({
    where: { id },
    data: { payloadJson },
  });

  return NextResponse.json({ ok: true });
}
