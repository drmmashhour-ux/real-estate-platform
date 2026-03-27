import { NextResponse } from "next/server";
import { getManagerInsights } from "@/lib/ai-property-manager";

export const dynamic = "force-dynamic";

const DEMO_LISTING = {
  title: "Luxury Villa in Montreal",
  description: "Modern property with premium finishes.",
  price: 850000,
  bedrooms: 4,
  bathrooms: 3,
  city: "Montreal",
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const listingId = body?.listingId;
    let listing = body?.listing ?? DEMO_LISTING;
    if (listingId && !body?.listing) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/design-studio/payload?id=${encodeURIComponent(listingId)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (data?.title) {
          listing = {
            title: data.title,
            description: data.description ?? listing.description,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            city: listing.city,
          };
        }
      } catch {
        // use demo
      }
    }
    const result = getManagerInsights(listing as any);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        status: "needs_attention",
        issues: ["Unable to load AI insights."],
        recommendedActions: ["Try again later.", "Ensure listing has title and description."],
      },
      { status: 200 }
    );
  }
}
