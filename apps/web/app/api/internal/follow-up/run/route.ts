import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpsForActiveUsers, processClientFollowUpQueue } from "@/lib/follow-up/client-follow-up-engine";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const allowed = process.env.CRON_SECRET?.trim() || process.env.BNHUB_GROWTH_CRON_SECRET?.trim() || "";
  return Boolean(token && allowed && token === allowed);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queuedUsers = await generateFollowUpsForActiveUsers();
  const processed = await processClientFollowUpQueue();

  return NextResponse.json({
    ok: true,
    queuedUsers,
    processed,
  });
}
