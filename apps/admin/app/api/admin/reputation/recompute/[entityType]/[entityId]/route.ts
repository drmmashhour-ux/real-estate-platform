import { NextResponse } from "next/server";
import type { ReputationEntityType } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { updateReputationScore } from "@/lib/reputation/update-reputation-score";

export const dynamic = "force-dynamic";

const ALLOWED: ReputationEntityType[] = ["host", "broker", "seller", "listing", "buyer"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { entityType, entityId } = await params;
  const t = entityType as ReputationEntityType;
  if (!ALLOWED.includes(t) || !entityId?.trim()) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  await updateReputationScore(t, entityId);
  return NextResponse.json({ ok: true });
}
