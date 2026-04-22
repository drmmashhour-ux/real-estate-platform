import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getCommandAlerts } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const alerts = await getCommandAlerts();
  return NextResponse.json({ alerts }, { headers: { "Cache-Control": "private, max-age=30" } });
}
