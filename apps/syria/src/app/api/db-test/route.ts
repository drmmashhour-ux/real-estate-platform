import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/db-test — Prisma connectivity check (no auth; restrict or protect in production monitoring).
 * Response contains no secrets.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error", message: "database_unreachable" }, { status: 503 });
  }
}
