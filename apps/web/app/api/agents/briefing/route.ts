import { NextResponse } from "next/server";
import { buildExecutiveBriefing } from "@/modules/agents/executive-briefing.service";
import { requireAgentsSession } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  try {
    const briefing = await buildExecutiveBriefing(auth.userId, auth.role as import("@prisma/client").PlatformRole);
    return NextResponse.json(briefing);
  } catch {
    return NextResponse.json({ error: "Briefing unavailable" }, { status: 500 });
  }
}
