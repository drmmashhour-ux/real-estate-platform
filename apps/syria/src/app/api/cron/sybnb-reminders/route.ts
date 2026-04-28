import { NextRequest } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";
import { runSybnbRemindersCron } from "@/lib/sybnb/reminders";

export const dynamic = "force-dynamic";

/** Authorization: Bearer $CRON_SECRET (same pattern as `/api/sybnb/cron/complete-bookings`). */
function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

export async function GET(req: NextRequest): Promise<Response> {
  return run(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return run(req);
}

async function run(req: NextRequest): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }
  if (!authorize(req)) {
    return sybnbFail("Unauthorized", 401);
  }

  try {
    const r = await runSybnbRemindersCron(new Date());
    return sybnbJson({
      ok: true,
      scanned: r.scanned,
      sent: r.deliveries.length,
      deliveries: r.deliveries,
    });
  } catch (e) {
    console.error("[SYBNB] reminders cron failed", e instanceof Error ? e.message : e);
    return sybnbFail("server_error", 500);
  }
}
