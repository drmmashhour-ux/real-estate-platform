import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getHotLeads } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const lim = Number(new URL(req.url).searchParams.get("limit")) || 14;
  const leads = await getHotLeads(Math.min(40, Math.max(4, lim)));
  return NextResponse.json({ leads }, { headers: { "Cache-Control": "private, max-age=15" } });
}
