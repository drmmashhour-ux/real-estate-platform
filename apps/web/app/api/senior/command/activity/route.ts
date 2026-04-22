import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getActivityFeed } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const lim = Number(new URL(req.url).searchParams.get("limit")) || 35;
  const activity = await getActivityFeed(Math.min(80, Math.max(10, lim)));
  return NextResponse.json({ activity }, { headers: { "Cache-Control": "private, max-age=10" } });
}
