import { NextResponse } from "next/server";
import type { ComplaintStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { reviewReputationComplaint } from "@/lib/reputation/review-complaint";

export const dynamic = "force-dynamic";

const ALLOWED: ComplaintStatus[] = ["open", "under_review", "confirmed", "dismissed", "resolved"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = await params;
  let body: { status?: ComplaintStatus };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.status || !ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await reviewReputationComplaint(id, body.status);
  return NextResponse.json({ ok: true });
}
