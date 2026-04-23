import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { syncIcsImport } from "@/modules/calendar/ics/ics-sync.service";

export const dynamic = "force-dynamic";

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return !!(secret && token === secret);
}

async function runAllEnabledImports(): Promise<Response> {
  const imports = await prisma.listingIcsImport.findMany({
    where: { isEnabled: true },
  });

  const results: Array<
    | { importId: string; success: true; count: number }
    | { importId: string; success: false; error: string }
  > = [];

  for (const row of imports) {
    try {
      const result = await syncIcsImport(row.id);
      results.push({ importId: row.id, success: true, count: result.count });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";

      await prisma.calendarSyncLog.create({
        data: {
          listingId: row.listingId,
          importId: row.id,
          direction: "import",
          status: "failed",
          message,
        },
      });

      results.push({ importId: row.id, success: false, error: message });
    }
  }

  return Response.json({ success: true, results });
}

/** GET / POST — refresh all enabled ICS imports (cron). Authorization: Bearer $CRON_SECRET */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAllEnabledImports();
}

export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAllEnabledImports();
}
