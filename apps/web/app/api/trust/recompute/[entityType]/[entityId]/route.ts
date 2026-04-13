import { NextResponse } from "next/server";
import type { PlatformTrustEntityType } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { updatePlatformTrustScore } from "@/lib/trust/update-trust-score";

export const dynamic = "force-dynamic";

const ALLOWED: PlatformTrustEntityType[] = ["user", "host", "broker", "listing"];

/**
 * POST /api/trust/recompute/[entityType]/[entityId] — recompute platform trust (admin).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { entityType, entityId } = await params;
  if (!ALLOWED.includes(entityType as PlatformTrustEntityType)) {
    return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
  }
  if (!entityId?.trim()) {
    return NextResponse.json({ error: "Missing entityId" }, { status: 400 });
  }

  await updatePlatformTrustScore(entityType as PlatformTrustEntityType, entityId);
  return NextResponse.json({ ok: true });
}
