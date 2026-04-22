import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireResidenceDashboardApi } from "@/lib/senior-dashboard/api-auth";
import { getResidenceDashboardPayload } from "@/modules/senior-living/dashboard/residence-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireResidenceDashboardApi();
  if (!auth.ok) return auth.response;

  const rid = request.nextUrl.searchParams.get("residenceId");

  if (auth.access.kind === "platform_admin") {
    const targetId =
      rid ??
      (await prisma.seniorResidence.findFirst({ orderBy: { updatedAt: "desc" }, select: { id: true } }))?.id;
    if (!targetId) {
      return NextResponse.json({ error: "No residence on file" }, { status: 404 });
    }
    const payload = await getResidenceDashboardPayload({
      residenceId: targetId,
      operatorUserId: auth.userId,
      isAdminPreview: true,
    });
    if (!payload) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (auth.access.kind !== "residence_operator") {
    return NextResponse.json({ error: "Use the management dashboard for your role" }, { status: 403 });
  }

  const payload = await getResidenceDashboardPayload({
    residenceId: auth.access.residenceId,
    operatorUserId: auth.userId,
  });
  if (!payload) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
