import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { reviewVerificationRequest } from "@/lib/trust/review-verification-request";

export const dynamic = "force-dynamic";

/**
 * POST /api/trust/verification-request/[id]/review — admin approve/reject.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const adminId = admin.userId;

  const { id } = await params;
  let body: { status?: "approved" | "rejected"; note?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json({ error: "status must be approved | rejected" }, { status: 400 });
  }

  try {
    await reviewVerificationRequest({
      requestId: id,
      reviewerUserId: adminId,
      status: body.status,
      note: body.note,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
