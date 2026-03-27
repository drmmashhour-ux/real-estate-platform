import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public config for a municipality slug (active only). */
export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const row = await prisma.welcomeTaxMunicipalityConfig.findFirst({
    where: { slug, active: true },
    select: {
      slug: true,
      name: true,
      bracketsJson: true,
      rebateRulesJson: true,
      notes: true,
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ config: row });
}
