import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getAiInsightBullets } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const insights = await getAiInsightBullets();
  return NextResponse.json({ insights }, { headers: { "Cache-Control": "private, max-age=45" } });
}
