import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import {
  recommendLuxuryTemplate,
  getAiFallbacksForHub,
  getLuxuryInsights,
  generateMarketing,
} from "@/lib/ai/brain";
import { rankProjectsForInvestment } from "@/lib/ai/investment-ranking";

/**
 * Luxury dashboard data only. Called by client so the dashboard page itself stays light.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [template, insights, fallbacks, aiCopy, projects] = await Promise.all([
      Promise.resolve(recommendLuxuryTemplate()),
      Promise.resolve(getLuxuryInsights()),
      Promise.resolve(getAiFallbacksForHub("luxury") as { insights?: string }),
      Promise.resolve(generateMarketing({ title: "Luxury Villa" })),
      prisma.project
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
        .catch(() => []),
    ]);

    const source = projects.length ? projects : DEMO_PROJECTS;
    const top3 = rankProjectsForInvestment(
      source.map((p: { id: string; city: string; status: string; startingPrice: number; featured: boolean | null; deliveryDate: Date | string; name: string }) => ({
        id: p.id,
        city: p.city,
        status: p.status,
        startingPrice: p.startingPrice,
        featured: p.featured,
        deliveryDate: p.deliveryDate,
        name: p.name,
      })),
      {}
    ).slice(0, 3);

    return NextResponse.json({
      template,
      insights,
      fallbacks,
      aiCopy,
      top3: top3.map((t) => ({ projectId: t.projectId, rank: t.rank, reason: t.reason, score: t.score })),
    });
  } catch (e) {
    console.error("GET /api/dashboard/luxury:", e);
    return NextResponse.json(
      {
        template: { name: "Luxury", reason: "Default" },
        insights: { luxuryAppealScore: 85, suggestions: ["Use premium imagery.", "Highlight concierge services."] },
        fallbacks: { insights: "Premium positioning performs best." },
        aiCopy: { headline: "Luxury living.", body: "Discover exceptional properties.", cta: "View collection" },
        top3: [],
      },
      { status: 200 }
    );
  }
}
