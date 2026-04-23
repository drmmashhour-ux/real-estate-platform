import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildExecutiveSnapshot } from "@/lib/executive/aggregate";
import { generateExecutiveSummary } from "@/lib/executive/summary";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await req.json().catch(() => ({}));
  const ownerType = typeof body.ownerType === "string" ? body.ownerType : "admin";
  /** Platform-wide cockpit bucket (not a user id). */
  const ownerId = typeof body.ownerId === "string" ? body.ownerId : "platform";

  const snapshot = await buildExecutiveSnapshot({ ownerType, ownerId });

  await recordAuditEvent({
    actorUserId: admin.userId,
    action: "EXECUTIVE_SNAPSHOT_CREATED",
    payload: { snapshotId: snapshot.id, ownerType, ownerId },
  });

  try {
    const updated = await generateExecutiveSummary(snapshot.id, admin.userId);
    return NextResponse.json({ success: true, snapshot: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: msg, snapshot },
      { status: msg === "EXECUTIVE_SNAPSHOT_NOT_FOUND" ? 404 : 422 }
    );
  }
}

export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const ownerType = searchParams.get("ownerType") ?? "admin";
  const ownerId = searchParams.get("ownerId") ?? "platform";

  const snapshot = await prisma.executiveSnapshot.findFirst({
    where: { ownerType, ownerId },
    orderBy: { snapshotDate: "desc" },
  });

  return NextResponse.json({ success: true, snapshot });
}
