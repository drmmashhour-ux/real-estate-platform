import { NextResponse } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getSeniorCommandKpis } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  logSeniorCommand("[senior-command]", "kpis_fetch", { userId: auth.ctx.userId.slice(0, 8) });
  const data = await getSeniorCommandKpis();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=15",
    },
  });
}
