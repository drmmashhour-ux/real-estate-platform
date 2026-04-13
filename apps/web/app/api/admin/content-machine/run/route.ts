import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runContentMachineForListing } from "@/lib/content-machine/pipeline";

export const dynamic = "force-dynamic";

/** Generate 5 style rows + vertical cards + schedules for one listing */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json().catch(() => ({}))) as { listingId?: unknown; skipSchedule?: unknown };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  const skipSchedule = body.skipSchedule === true;

  const result = await runContentMachineForListing(listingId, { force: true, skipSchedule });
  return NextResponse.json({ ok: true, ...result });
}
