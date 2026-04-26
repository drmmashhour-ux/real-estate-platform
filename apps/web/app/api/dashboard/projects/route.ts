import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import { rankProjectsForInvestment } from "@/lib/ai/investment-ranking";

/** Projects dashboard data only. Keeps projects hub page light. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project
      .findMany({
        select: {
          id: true,
          city: true,
          status: true,
          startingPrice: true,
          featured: true,
          deliveryDate: true,
          name: true,
        },
        take: 10,
      })
      .catch(() => []);

    const source = projects.length ? projects : DEMO_PROJECTS;
    const unitsMap =
      projects.length > 0
        ? {}
        : (DEMO_PROJECTS as { id: string; units?: { id: string; type: string; price: number; size: number; status: string }[] }[]).reduce<
            Record<string, { id: string; type: string; price: number; size: number; status: string }[]>
          >((acc, p) => {
            acc[p.id] = p.units ?? [];
            return acc;
          }, {});

    const ranked = rankProjectsForInvestment(
      source.map((p: { id: string; city: string; status: string; startingPrice: number; featured: boolean | null; deliveryDate: Date | string; name: string }) => ({
        id: p.id,
        city: p.city,
        status: p.status,
        startingPrice: p.startingPrice,
        featured: p.featured,
        deliveryDate: p.deliveryDate,
        name: p.name,
      })),
      unitsMap
    ).slice(0, 3);

    return NextResponse.json(
      ranked.map((r) => ({ projectId: r.projectId, rank: r.rank, reason: r.reason, score: r.score }))
    );
  } catch (e) {
    console.error("GET /api/dashboard/projects:", e);
    return NextResponse.json([], { status: 200 });
  }
}
