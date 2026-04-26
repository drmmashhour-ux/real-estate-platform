import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Public: approved testimonials (optionally featured only). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const featuredOnly = searchParams.get("featured") === "true";
    const take = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

    const rows = await prisma.testimonial.findMany({
      where: {
        isApproved: true,
        ...(featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take,
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load testimonials" }, { status: 500 });
  }
}
