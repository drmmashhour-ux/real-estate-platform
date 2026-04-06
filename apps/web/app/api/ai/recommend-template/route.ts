import { NextResponse } from "next/server";
import { recommendTemplate } from "@/lib/ai/template-recommendation";
import { logAiEvent } from "@/lib/ai/log";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const listingId = body?.listingId;
    let listing = body?.listing ?? null;
    if (listingId && !body?.listing) {
      try {
        const res = await fetch(
          `${getPublicAppUrl()}/api/design-studio/payload?id=${encodeURIComponent(listingId)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (data?.title) {
          listing = {
            title: data.title,
            description: data.description,
          };
        }
      } catch {
        // use null
      }
    }
    const result = recommendTemplate(listing);
    logAiEvent("template_recommended", { listingId, recommendedTemplateId: result.recommendedTemplateId });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { recommendedTemplateId: "real-estate-poster-1", reason: "Default recommendation." },
      { status: 200 }
    );
  }
}
