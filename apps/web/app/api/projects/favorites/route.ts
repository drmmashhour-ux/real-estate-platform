import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getProjectsUserId } from "@/lib/projects-user";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getProjectsUserId();
    const list = await prisma.favoriteProject.findMany({
      where: { userId },
      include: { project: { include: { units: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list.map((f) => ({ projectId: f.projectId, project: f.project })));
  } catch (e) {
    console.error("GET /api/projects/favorites:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const projectId = body.projectId ?? body.project_id;
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }
    await prisma.favoriteProject.upsert({
      where: {
        userId_projectId: { userId, projectId },
      },
      create: { userId, projectId },
      update: {},
    });
    void trackEvent("favorite", { projectId, kind: "project" }, { userId }).catch(() => {});
    return NextResponse.json({ success: true, projectId });
  } catch (e) {
    console.error("POST /api/projects/favorites:", e);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }
    await prisma.favoriteProject.deleteMany({
      where: { userId, projectId },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/projects/favorites:", e);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
