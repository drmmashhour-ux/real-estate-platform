import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { updateLeadStatus } from "@/modules/senior-living/lead.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  try {
    const lead = await prisma.seniorLead.findUnique({
      where: { id },
      include: { residence: { select: { operatorId: true } } },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const ok =
      user?.role === PlatformRole.ADMIN ||
      (lead.residence.operatorId && lead.residence.operatorId === userId);

    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await updateLeadStatus(id, status);
    return NextResponse.json({ lead: updated });
  } catch (e) {
    logError("[api.senior.leads.patch]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
