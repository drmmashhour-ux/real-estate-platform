import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Public list of active municipality configs for calculators. */
export async function GET() {
  const rows = await prisma.welcomeTaxMunicipalityConfig.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { slug: true, name: true, notes: true },
  });
  return NextResponse.json({ municipalities: rows });
}
