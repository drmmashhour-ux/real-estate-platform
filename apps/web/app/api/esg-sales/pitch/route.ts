import { NextResponse } from "next/server";
import { parseGreenDocumentRequestBody } from "@/modules/green-ai/documents/document-generator";
import { runEsgSalesPitch } from "@/modules/esg-sales/esg-sales.engine";

export const dynamic = "force-dynamic";

/** POST — broker/seller conversational ESG pitch bundle (runs subsidy pipeline server-side). */
export async function POST(req: Request) {
  try {
    const body = ((await req.json()) as Record<string, unknown>) ?? {};
    const parsed = parseGreenDocumentRequestBody(body);

    const pitch = await runEsgSalesPitch({
      intake: parsed.intake,
      documents: parsed.documents ?? [],
      selectedImprovementActions: parsed.selectedImprovementActions,
      locationRegion: parsed.locationRegion,
      propertyValueMajor: parsed.propertyValueMajor,
      propertyValue: parsed.propertyValue,
      windowCount: parsed.windowCount,
      programTier: parsed.programTier,
      premiumReportPurchased: parsed.premiumReportPurchased,
      persistedVerificationLevel: parsed.persistedVerificationLevel,
      contractorRegion: parsed.contractorRegion,
      contractorMatchLimit: parsed.contractorMatchLimit,
      propertyLabel:
        typeof body.propertyLabel === "string"
          ? body.propertyLabel
          : typeof body.listingTitle === "string"
            ? body.listingTitle
            : parsed.listingTitle ?? undefined,
      city: parsed.city ?? parsed.region ?? (typeof body.city === "string" ? body.city : undefined),
      premiumBrokerTier:
        parsed.tier === "premium" ||
        body.brokerPremium === true ||
        body.premiumBrokerTier === true,
    });

    return NextResponse.json(pitch);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Pitch generation failed" }, { status: 500 });
  }
}
