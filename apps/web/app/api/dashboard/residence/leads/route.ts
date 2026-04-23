import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireResidenceDashboardApi } from "@/lib/senior-dashboard/api-auth";
import { getResidenceDashboardPayload } from "@/modules/senior-living/dashboard/residence-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireResidenceDashboardApi();
  if (!auth.ok) return auth.response;

  const rid = new URL(request.url).searchParams.get("residenceId");

  if (auth.access.kind === "platform_admin") {
    const targetId =
      rid ??
      (await prisma.seniorResidence.findFirst({ orderBy: { updatedAt: "desc" }, select: { id: true } }))?.id;
    if (!targetId) return NextResponse.json({ leads: [] });
    const p = await getResidenceDashboardPayload({
      residenceId: targetId,
      operatorUserId: auth.userId,
      isAdminPreview: true,
    });
    return NextResponse.json({ leads: p?.leadQueue ?? [] });
  }

  if (auth.access.kind !== "residence_operator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const p = await getResidenceDashboardPayload({
    residenceId: auth.access.residenceId,
    operatorUserId: auth.userId,
  });
  return NextResponse.json({ leads: p?.leadQueue ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}
