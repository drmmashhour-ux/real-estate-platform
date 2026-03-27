import { NextRequest } from "next/server";
import { isAiManagerEnabled, callAiManager } from "@/lib/ai-manager-client";
import { analyzeListing } from "@/lib/ai-listing-analysis";

export const dynamic = "force-dynamic";

/** POST /api/ai/listing-quality – listing quality score and suggested improvements. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, amenities, reviews, photoCount, photoUrls, listingId } = body;
    if (!title || typeof title !== "string") {
      return Response.json({ error: "title required" }, { status: 400 });
    }

    if (isAiManagerEnabled()) {
      const result = await callAiManager<{
        listingQualityScore: number;
        suggestedImprovements: { area: string; priority: string; suggestion: string }[];
        summary: string;
      }>("/v1/ai-manager/listing-quality", {
        listingId,
        title,
        description,
        amenities,
        reviews,
        photoCount,
        photoUrls,
      });
      return Response.json(result);
    }

    const analysis = analyzeListing({
      title,
      description,
      amenities,
      photos: photoUrls ?? (typeof photoCount === "number" ? Array(photoCount).fill("") : undefined),
    });
    const suggestedImprovements = analysis.recommendations.map((r) => ({
      area: r.type,
      priority: r.priority,
      suggestion: r.suggestion,
    }));
    return Response.json({
      listingQualityScore: analysis.overallScore,
      suggestedImprovements,
      summary: analysis.summary,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to analyze listing quality" },
      { status: 500 }
    );
  }
}
