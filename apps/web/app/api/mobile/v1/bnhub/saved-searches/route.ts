import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BNHUB_MODE = "short" as const;

/**
 * GET — BNHUB saved searches (stored as SearchEngineMode `short`).
 */
export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.savedSearch.findMany({
    where: { userId: user.id, mode: BNHUB_MODE },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, filtersJson: true, createdAt: true },
  });

  return Response.json({
    savedSearches: rows.map((r) => ({
      id: r.id,
      name: r.name,
      filters: r.filtersJson,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/**
 * POST — save BNHUB filters (city, dates, guests, etc.) for alerts + retention.
 */
export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: unknown;
    filters?: unknown;
  };
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  if (!name) {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  if (body.filters == null || typeof body.filters !== "object" || Array.isArray(body.filters)) {
    return Response.json({ error: "filters object required" }, { status: 400 });
  }

  const row = await prisma.savedSearch.create({
    data: {
      userId: user.id,
      mode: BNHUB_MODE,
      name,
      filtersJson: body.filters as object,
    },
    select: { id: true, name: true, filtersJson: true, createdAt: true },
  });

  return Response.json({
    id: row.id,
    name: row.name,
    filters: row.filtersJson,
    createdAt: row.createdAt.toISOString(),
  });
}
