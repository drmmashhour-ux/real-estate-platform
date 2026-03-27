import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createEnterpriseWorkspace } from "@/modules/enterprise/infrastructure/enterpriseWorkspaceService";

export const dynamic = "force-dynamic";

/** POST /api/workspaces — create enterprise workspace (authenticated user becomes owner). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string; slug?: string };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const ws = await createEnterpriseWorkspace(prisma, {
      userId,
      name,
      slug: typeof body.slug === "string" ? body.slug : undefined,
    });
    return NextResponse.json({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      planTier: ws.planTier,
      seatLimit: ws.seatLimit,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create workspace";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
