import { NextResponse } from "next/server";
import type { ReviewStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { moderateReputationReview } from "@/lib/reputation/moderate-review";

export const dynamic = "force-dynamic";

const ALLOWED: ReviewStatus[] = ["pending", "published", "hidden", "flagged"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = await params;
  let body: { status?: ReviewStatus };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.status || !ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await moderateReputationReview(id, body.status);
  return NextResponse.json({ ok: true });
}
