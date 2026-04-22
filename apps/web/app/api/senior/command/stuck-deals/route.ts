import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getStuckDeals } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const lim = Number(new URL(req.url).searchParams.get("limit")) || 18;
  const stuck = await getStuckDeals(Math.min(50, Math.max(5, lim)));
  return NextResponse.json({ stuck }, { headers: { "Cache-Control": "private, max-age=15" } });
}
