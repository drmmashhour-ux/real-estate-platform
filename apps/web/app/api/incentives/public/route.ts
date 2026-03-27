import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.incentiveProgramConfig.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      jurisdiction: true,
      externalLink: true,
      notes: true,
    },
  });
  return NextResponse.json({ incentives: rows });
}
