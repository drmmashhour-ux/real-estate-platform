import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { buildExecutivePayload } from "@/modules/command-center/command-center.service";
import { assertCommandCenterEnabled } from "@/modules/command-center/command-center.gate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const gate = assertCommandCenterEnabled("executive");
  if (!gate.ok) return NextResponse.json({ error: gate.code }, { status: 403 });

  const data = await buildExecutivePayload(request.nextUrl.searchParams);
  return NextResponse.json(data);
}
