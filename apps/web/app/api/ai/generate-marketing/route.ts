import { NextResponse } from "next/server";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { analyzeListing } from "@/lib/ai/brain";
import { logAiEvent } from "@/lib/ai/log";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const DEMO = {
  title: "Luxury Villa in Montreal",
  subtitle: "4 bed, 3 bath — $850,000",
  shortDescription: "Modern luxury property with premium finishes and excellent location.",
  longDescription:
    "This stunning property offers spacious living areas, modern kitchen, and a prime location. Perfect for families seeking quality and style. Schedule a viewing today.",
  socialCaption: "Just listed: Luxury Villa in Montreal. 4 bed, 3 bath. DM for details. #realestate #montreal",
  callToAction: "Schedule a viewing — contact us today!",
  score: 78,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const listingId = body?.listingId;
    let listing: { title: string; description: string; price: number; bedrooms: number; bathrooms: number; city: string } = {
      title: DEMO.title,
      description: DEMO.shortDescription,
      price: 850000,
      bedrooms: 4,
      bathrooms: 3,
      city: "Montreal",
    };
    if (listingId) {
      try {
        const res = await fetch(
          `${getPublicAppUrl()}/api/design-studio/payload?id=${encodeURIComponent(listingId)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (data?.title) {
          listing = {
            title: String(data.title),
            description: String(data.description ?? DEMO.shortDescription),
            price: 850000,
            bedrooms: 4,
            bathrooms: 3,
            city: "Montreal",
          };
        }
      } catch {
        // use DEMO
      }
    }

    if (isOpenAiConfigured()) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Generate a high-converting real estate listing title and description for: ${JSON.stringify(listing)}`,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? "";
      logAiEvent("marketing_generation_run", { listingId, source: "openai" });
      return NextResponse.json({ content });
    }

    // Fallback when OPENAI_API_KEY is not set
    const { score } = analyzeListing(listing);
    const title = listing.title;
    const city = listing.city;
    const result = {
      title,
      subtitle: `${listing.bedrooms} bed, ${listing.bathrooms} bath — $${listing.price.toLocaleString()}`,
      shortDescription: listing.description,
      longDescription:
        listing.description +
        " Schedule a viewing today — contact us for more details.",
      socialCaption: `Just listed: ${title}. ${city}. DM for details. #realestate`,
      callToAction: DEMO.callToAction,
      score,
    };
    logAiEvent("marketing_generation_run", { listingId, score: result.score });
    return NextResponse.json({
      content: [result.title, result.subtitle, result.longDescription, result.callToAction].join("\n\n"),
      ...result,
    });
  } catch (e) {
    logError("POST /api/ai/generate-marketing", e);
    return NextResponse.json(
      { content: DEMO.longDescription, ...DEMO },
      { status: 200 }
    );
  }
}
