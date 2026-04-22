import { NextResponse } from "next/server";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getLeadDetailForCommand } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const detail = await getLeadDetailForCommand(id.trim());
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}
