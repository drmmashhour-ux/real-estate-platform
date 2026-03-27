import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectsUserId } from "@/lib/projects-user";

export const dynamic = "force-dynamic";

/** GET — List saved searches for the current user */
export async function GET() {
  try {
    const userId = await getProjectsUserId();
    const list = await prisma.savedProjectSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/projects/saved-searches:", e);
    return NextResponse.json({ error: "Failed to load saved searches" }, { status: 500 });
  }
}

/** POST — Save current search. Body: { name: string, params: object } */
export async function POST(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() || "My search" : "My search";
    const params = body.params && typeof body.params === "object" ? body.params : {};
    const saved = await prisma.savedProjectSearch.create({
      data: { userId, name, params },
    });
    return NextResponse.json(saved);
  } catch (e) {
    console.error("POST /api/projects/saved-searches:", e);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}

/** DELETE — Remove a saved search. Query: id */
export async function DELETE(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await prisma.savedProjectSearch.deleteMany({
      where: { id, userId },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/projects/saved-searches:", e);
    return NextResponse.json({ error: "Failed to delete search" }, { status: 500 });
  }
}
