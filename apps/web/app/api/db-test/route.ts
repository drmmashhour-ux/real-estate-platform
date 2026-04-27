import { getLegacyDB } from "@/lib/db/legacy";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

/**
 * GET /api/db-test — lightweight Prisma connectivity check (no auth; use behind edge / monitoring only).
 */
export async function GET() {
  try {
    const prisma = getLegacyDB();
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch (e) {
    logError(e, { route: "/api/db-test" });
    return Response.json(
      { status: "error", message: e instanceof Error ? e.message : "database_unreachable" },
      { status: 503 }
    );
  }
}
