import { NextRequest, NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { autoCompleteDueSybnbBookings } from "@/lib/sybnb/sybnb-v1-lifecycle";
import { sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/sybnb/cron/complete-bookings — mark `confirmed` / `paid` stays as `completed` the day after `checkOut` (UTC calendar).
 * Authorization: Bearer $CRON_SECRET
 */
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
    const r = await autoCompleteDueSybnbBookings(new Date());
    return sybnbJson({ updated: r.updated, bookingIds: r.ids });
  } catch (e) {
    console.error("[SYBNB] auto-complete failed", e instanceof Error ? e.message : e);
    return sybnbFail("server_error", 500);
  }
}
