import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createSeniorLead, listLeadsForAdmin, listLeadsForOperator } from "@/modules/senior-living/lead.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    if (user.role === PlatformRole.ADMIN) {
      const leads = await listLeadsForAdmin();
      return NextResponse.json({ leads });
    }
    const leads = await listLeadsForOperator(userId);
    return NextResponse.json({ leads });
  } catch (e) {
    logError("[api.senior.leads.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const residenceId = typeof body.residenceId === "string" ? body.residenceId.trim() : "";
  const requesterName = typeof body.requesterName === "string" ? body.requesterName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!residenceId || !requesterName || !email.includes("@")) {
    return NextResponse.json({ error: "residenceId, requesterName, email required" }, { status: 400 });
  }

  const userId = await getGuestId();

  try {
    const matchScore = typeof body.matchScore === "number" ? body.matchScore : null;

    const lead = await createSeniorLead({
      residenceId,
      requesterName,
      email,
      phone: typeof body.phone === "string" ? body.phone : null,
      needsLevel: typeof body.needsLevel === "string" ? body.needsLevel : null,
      budget: typeof body.budget === "number" ? body.budget : null,
      familyUserId: userId ?? null,
      matchScore,
    });
    return NextResponse.json({ lead });
  } catch (e) {
    logError("[api.senior.leads.post]", { error: e });
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
