import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getOperatorSummaries } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const operators = await getOperatorSummaries();
  return NextResponse.json({ operators }, { headers: { "Cache-Control": "private, max-age=30" } });
}
