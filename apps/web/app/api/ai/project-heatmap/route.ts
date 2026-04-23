import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import { analyzeDemandZone } from "@/lib/ai/projects-heatmap";

export const dynamic = "force-dynamic";

function getCoords(p: { latitude?: number | null; longitude?: number | null; city?: string }) {
  const city = (p.city ?? "").toLowerCase();
  if (p.latitude != null && p.longitude != null) {
    return { latitude: p.latitude, longitude: p.longitude };
  }
  if (city === "laval") return { latitude: 45.6066, longitude: -73.7243 };
  return { latitude: 45.5017, longitude: -73.5673 };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");

    let projects: { id: string; city?: string; latitude?: number | null; longitude?: number | null; featured?: boolean | null; status?: string }[];
    try {
      projects = await prisma.project.findMany({
        where: city ? { city: { equals: city, mode: "insensitive" } } : {},
        select: { id: true, city: true, latitude: true, longitude: true, featured: true, status: true },
      });
      if (projects.length === 0) {
        projects = DEMO_PROJECTS.map((p) => ({
          id: p.id,
          city: p.city,
          latitude: (p as { latitude?: number }).latitude ?? null,
          longitude: (p as { longitude?: number }).longitude ?? null,
          featured: (p as { featured?: boolean }).featured ?? null,
          status: p.status,
        }));
      }
    } catch {
      projects = DEMO_PROJECTS.map((p) => ({
        id: p.id,
        city: p.city,
        latitude: (p as { latitude?: number }).latitude ?? null,
        longitude: (p as { longitude?: number }).longitude ?? null,
        featured: (p as { featured?: boolean }).featured ?? null,
        status: p.status,
      }));
    }

    const result = projects.map((p) => {
      const coords = getCoords(p);
      const { demandScore, demandLabel, weight } = analyzeDemandZone({
        ...p,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return {
        projectId: p.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        demandScore,
        demandLabel,
        weight,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/ai/project-heatmap:", e);
    return NextResponse.json([], { status: 200 });
  }
}
