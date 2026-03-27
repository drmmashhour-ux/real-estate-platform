import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import type { SearchEngineMode } from "@/components/search/FilterState";

export const dynamic = "force-dynamic";

const MODES = new Set<SearchEngineMode>(["buy", "rent", "short"]);

/**
 * GET /api/search/saved — list saved searches for the current user.
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, mode: true, name: true, filtersJson: true, createdAt: true },
  });
  return NextResponse.json({ data: rows });
}

/**
 * POST /api/search/saved — save current filters.
 * Body: { name: string, mode: SearchEngineMode, filtersJson: object }
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      mode?: string;
      filtersJson?: unknown;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const mode = typeof body.mode === "string" ? body.mode.trim() : "";
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!MODES.has(mode as SearchEngineMode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (body.filtersJson == null || typeof body.filtersJson !== "object") {
      return NextResponse.json({ error: "Invalid filtersJson" }, { status: 400 });
    }

    const row = await prisma.savedSearch.create({
      data: {
        userId,
        mode,
        name,
        filtersJson: body.filtersJson as object,
      },
      select: { id: true, mode: true, name: true, filtersJson: true, createdAt: true },
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
