import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Public: published case studies. */
export async function GET() {
  try {
    const rows = await prisma.caseStudy.findMany({
      where: { isPublished: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        city: true,
        summary: true,
        image: true,
        featured: true,
        createdAt: true,
      },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load case studies" }, { status: 500 });
  }
}
